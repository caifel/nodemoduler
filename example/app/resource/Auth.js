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

		if (req.header('Authorization')) {
			token = req.header('Authorization').split(' ')[1];
			payload = me.jwt.decode(token, me._CONFIG.SECRET_TOKEN);
		}

		if (profile) {
			provider === 'google' && filters.push({ 'google': profile.sub });
			provider === 'github' && filters.push({ 'github': profile.id });

			profile.email && filters.push({ 'email': profile.email });
		}
		
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

	'sigpup': function(req, res) {
		var me = this;
		var User = me['userModel'];

		User.findOne({ email: req.body.email }, function(err, existingUser) {
			if (existingUser) {
				return res.status(409).send({ message: 'Email is already taken' });
			}
			var user = new User({
				email: req.body.email,
				password: req.body.password
			});
			user.save(function(err, result) {
				if (err) {
					res.status(500).send({ message: err.message });
				}
				res.send({ token: me.createJWT(result) });
			});
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