module.exports = {
	mixin: [ 'Jwt' ],
	model: [ 'User' ],

	init: function() {
		this.qs = require('querystring');
		this.request = require('request');
	},



	/**
	 * These Auth methods are used only when auth buttons are clicked.
	 *
	 * With social Auth there is no way to say "user_not_found, even in login"
	 * google provide us with data, so the user can be created.
	 */

	/**
	 * "With Authorization token" has the following cases:
	 * 		Case 1:
	 * 			 User with googleId is found, THEN
	 * 				- "user" and "token" are send in the response.
	 * 		Case 2:
	 * 			No user with googleId is found, THEN:
	 * 				- Get "payload" decoding the "token"
	 * 				- User with "_id" inside payload is found, SO
	 *
	 * 					"Note: This means that we have a user, but this
	 * 					user wasn't associated with a google account"
	 *
	 * 					-> 	UPDATE user with data provided by google
	 *
	 * 				- User with "_id" inside payload not found, SO
	 *
	 * 					"Note: This case is impossible, the only case would be
	 * 					if the user is removed and the logout is not trigger"
	 *
	 * 					->	Anyway a response with "user_not_found" is send.
	 * */

	'googleAuth': function(req, res) {
		var me = this;
		var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			grant_type: 'authorization_code',
			redirect_uri: req.body.redirectUri,
			client_secret: me._CONFIG.GOOGLE_AUTH_SECRET
		};

		me.request.post(accessTokenUrl, {
			json: true,
			form: params
		}, function(error, response, token) {
			me.request.get({
				json: true,
				url: peopleApiUrl,
				headers: {
					Authorization: 'Bearer ' + token['access_token']
				}
			}, function(error, response, profile) {
				if (profile.error)
					return res.status(500).send({
						message: profile.error.message
					});
				me.processAuth(req, res, profile, 'google');
			});
		});
	},

	'githubAuth': function(req, res) {
		var me = this;

		var accessTokenUrl = 'https://github.com/login/oauth/access_token';
		var userApiUrl = 'https://api.github.com/user';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			redirect_uri: req.body.redirectUri,
			client_secret: me._CONFIG.GITHUB_AUTH_SECRET
		};

		me.request.get({
			qs: params,
			url: accessTokenUrl
		}, function(error, response, token) {
			me.request.get({
				json: true,
				url: userApiUrl,
				qs: me.qs.parse(token),
				headers: {
					'User-Agent': 'Satellizer'
				}
			}, function(error, response, profile) {
				me.processAuth(req, res, profile, 'github');
			});
		});
	},
	
	'processAuth': function (req, res, profile, provider) {
		var me = this;
		var token;
		var payload;
		var filters = [];
		var User = me['userModel'];
		var success = function (user) {
			res.json({
				user: user,
				token: me.createJWT(user)
			});
		};
		var failFn = function (error) {
			res.status(500).send({
				message: error.message
			});
		};

		// Never should come here if the authorization exists and is valid.
		// Because of the initial validation in UI and "auth" middleware.

		// Consequence, the welcome or log-in/sign-up pages are not going
		// to be reachable while an authorization get exists and is valid.
		// LOOK a way to make welcome page reachable anyway (it depends of the type of app)

		// A user can only use ONE provider, so to query
		// by provider is not realistic neither correct.

		// So by priority the question is:
		// ¿Does the "email" that I want to register already exists?
		// 		If it does exists, then I return JUST the token.
		// 			Then the UI app will be reset, the isAuthenticated will be "true"
		// 			The getMe service will be called successfully because the middleware will accept the token.
		// 		If it does NOT exists, then I create the user and return the token.
		//			Then, same as before
		// ¿Why must I look for "provider"?
		//		If you try to log-in or sign-up with google for example;
		//		and the EMAIL IS FOUND, an we verify that the account is linked with "google" (same provider)
		//		then we benefit of this to update the information.
		//
		//		But if the provider of our account is different than the one
		//		being use, then we refuse it, and send a message saying, that
		//		the email that he/she wanna use is in use and/or linked with a provider "XXX"

		// So a field provider is gonna be need, and this will be an String (Google, Facebook ...)

		// Anyway in the model or here the should exists the support for the different type of login, providers


		if (req.header('Authorization')) { //
			token = req.header('Authorization').split(' ')[1]; //
			payload = me.jwt.decode(token, me._CONFIG.SECRET_TOKEN); //
		}

		if (profile) {
			provider === 'google' && filters.push({ 'google': profile.sub });
			provider === 'github' && filters.push({ 'github': profile.id });

			profile.email && filters.push({ 'email': profile.email });
		}


		/**
		 * This will be the new logic
		 * */
		User.findOne({
			email: profile.email
		}).then(function (user) {
			if (!user) {
				// Then create user.
				// return the token.
			}

			if (user.provider === provider) {
				// Update Information (Each provider has its own support).
				// return the token.
			}

			if (user.provider !== provider) {
				// Send message (email already registered and linked with a provider "XXX")
				// Do not return the token.
			}
		});
		/**
		 * This will be the new logic
		 * */
		
		payload && payload.sub && filters.push({ '_id': payload.sub });

		User.findOne({
			$or: filters
		}).then(function (user) {
			if (!user)
				user = new User();
			if (!user[provider])
				user.saveWithProvider(profile, provider).then(success, failFn);
			else
				success(user);
		}, failFn);
	},

	'signup': function(req, res) {
		var me = this;
		var User = me['userModel'];

		User.findOne({
			email: req.body.email
		}).then( function(user) {
			if (user)
				return res.status(409).send({ message: 'Email is already taken' });
			user = new User({
				email: req.body.email,
				password: req.body.password
			});
			user.save().then(function(result) {
				res.send({ token: me.createJWT(result) });
			}, function (error) {
				res.status(500).send({ message: error.message });
			});
		}, function (error) {
			res.status(500).send({ message: error.message });
		});
	},

	'login': function(req, res) {
		var me = this;
		var User = me['userModel'];

		User.findOne({
			email: req.body.email
		}, '+password', function(err, user) {
			if (!user) {
				return res.status(401).send({ message: 'Invalid email and/or password' });
			}
			user.comparePassword(req.body.password, function(err, isMatch) {
				if (!isMatch) {
					return res.status(401).send({ message: 'Invalid email and/or password' });
				}
				res.send({ token: me.createJWT(user) });
			});
		});
	},

	createJWT: function (user) {
		var me = this;

		return me.jwt.encode({
			sub: user._id,
			iat: me.moment().unix(),
			exp: me.moment().add(14, 'days').unix()
		}, me._CONFIG.SECRET_TOKEN);
	}
};