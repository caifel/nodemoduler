module.exports = {
	model: [ 'User' ],

	init: function() {
		this.qs = require('querystring');
		this.request = require('request');
	},

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
				headers: { Authorization: 'Bearer ' + token['access_token'] }
			}, function(error, response, profile) {
				if (profile.error)
					return res.status(500).send({
						message: profile.error.message
					});
				me.processAuth(req, res, profile, 'google');
			});
		});
	},

	'facebookAuth': function(req, res) {
		var me = this;
		var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
		var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
		var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			redirect_uri: req.body.redirectUri,
			client_secret: me._CONFIG.FACEBOOK_AUTH_SECRET
		};

		me.request.get({
			json: true,
			qs: params,
			url: accessTokenUrl
		}, function(error, response, token) {
			if (response.statusCode !== 200)
				return res.status(500).send({
					message: token.error.message
				});
			me.request.get({
				qs: token,
				json: true,
				url: graphApiUrl,
				headers: { 'User-Agent': 'Satellizer' }
			}, function(error, response, profile) {
				if (response.statusCode !== 200)
					return res.status(500).send({
						message: profile.error.message
					});
				me.processAuth(req, res, profile, 'facebook');
			});
		});
	},

	'signup': function(req, res) {
		var me = this;
		me.processAuth(req, res, req.body);
	},

	'processAuth': function (req, res, data, provider) {
		var me = this;
		var User = me['userModel'];
		var errorFn = function (error) {
			res.status(500).send({
				message: error.message
			});
		};
		var success = function (user) {
			res.json({
				token: me.createJWT(user)
			});
		};

		User.findOne({
			email: data.email
		}).then(function (user) {
			user = user || new User();

			if (!provider && user.email)
				return res.status(409).send({
					message: 'email_taken'
				});
			if (!provider || !user[provider])
				user.customSave(data, provider).then(success, errorFn);
			else
				success(user);
		}, errorFn);
	},

	'login': function(req, res) {
		var me = this;
		var errorFn = function (error) {
			res.status(500).send({
				message: error.message
			});
		};
		var invalidFn = function () {
			res.status(401).send({
				message: 'invalid_credentials'
			});
		};		

		me['userModel'].findOne({
			email: req.body.email
		}, '+password').then(function(user) {
			if (!user)
				return invalidFn();
			user.comparePassword(req.body.password, function(error, isMatch) {
				if (error)
					errorFn();
				if (!isMatch)
					return invalidFn();
				res.json({
					token: me.createJWT(user)
				});
			});
		}, errorFn);
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

/**
 * Never should come here if the authorization exists and is valid.
 * Because of the initial validation in UI and "auth" middleware.
 * Consequence, the welcome or log-in/sign-up pages are not going
 * to be reachable while an authorization token exists and is valid.
 * LOOK a way to make welcome page reachable anyway (it depends of the type of app)
 *
 * A user can only use ONE provider, so to query
 * by provider is not realistic neither correct.
 *
 * So by priority the questions are:
 * ¿Does the "email" that I want to register already exists?
 * 			If it does exists, then I return ONLY the token.
 * 			Then the UI app will be reset, the isAuthenticated will be "true"
 * 			The getMe service will be called successfully because the middleware will accept the token.
 * 		If it does NOT exists, then I create the user and return the token.
 * 			Then, same as before
 * ¿Why must I look for "provider"?
 * 		If you try to log-in or sign-up with google for example;
 * 		and the EMAIL IS FOUND, and we verify that the account is linked with "google" (same provider)
 * 		then we benefit of this to update the information.
 *
 * 		But if the provider of our account is different than the one
 * 		being use, then we refuse it, and send a message saying, that
 * 		the email that he/she wanna use is in use and/or linked with a provider "XXX"
 *
 * 	So a field provider is gonna be need, and this will be a String (Google, Facebook ...)
 *
 * 	Anyway in the model or here should exists the support for the different type of login, providers.
 * 	*/