module.exports = {
	models: [
		'User'
	],
	services: [
		'User'
	],

	init: function() {
		var me = this;

		me.moment = require('moment');
		me.jwt = require('jwt-simple');
		me.request = require('request');
	},

	'signup': function(req, res) {
		var me = this;

		me['userService'].createUser(req.body).then(function(response) {
			response.id ? res.json({
				success: true,
				user: response
			}) : res.json({
				success: false,
				message: response
			});
		});
	},
	
	'login': function (req, res) {
		res.json({
			name: 'mario'
		});
	},

	'googleAuth': function(req, res) {
		var me = this;
		var User = me['userModel'];
		var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			grant_type: 'authorization_code',
			redirect_uri: req.body.redirectUri,
			client_secret: me.GOOGLE_AUTH_SECRET
		};

		me.request.post(accessTokenUrl, {
			json: true,
			form: params
		}, function(err, response, token) {
			var accessToken = token['access_token'];
			var headers = {
				Authorization: 'Bearer ' + accessToken
			};

			me.request.get({
				url: peopleApiUrl,
				headers: headers,
				json: true
			}, function(err, response, profile) {
				if (profile.error)
					return res.status(500).send({
						message: profile.error.message
					});

				if (req.header('Authorization')) {
					User.findOne({
						google: profile.sub
					}, function(err, existingUser) {
						if (existingUser)
							return res.status(409).send({
								message: 'There is already a Google account that belongs to you'
							});
						var token = req.header('Authorization').split(' ')[1];
						var payload = me.jwt.decode(token, me.SECRET_TOKEN);
						User.findById(payload.sub, function(err, user) {
							if (!user)
								return res.status(400).send({ message: 'User not found' });
							user.google = profile.sub;
							user.displayName = user.displayName || profile.name;
							user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
							user.save(function() {
								var token = me.createJWT(user);
								res.send({
									user: user,
									token: token
								});
							});
						});
					});
				} else {
					User.findOne({
						google: profile.sub
					}, function(err, existingUser) {
						if (existingUser) {
							return res.send({
								user: existingUser,
								token: me.createJWT(existingUser)
							});
						}
						var user = new User();
						user.google = profile.sub;
						user.displayName = profile.name;
						user.picture = profile.picture.replace('sz=50', 'sz=200');
						user.save(function(err) {
							var token = me.createJWT(user);
							res.json({
								user: user,
								token: token
							});
						});
					});
				}
			});
		});
	},

	createJWT: function (user) {
		var me = this;
		var payload = {
			sub: user._id,
			iat: me.moment().unix(),
			exp: me.moment().add(14, 'days').unix()
		};

		return me.jwt.encode(payload, me.SECRET_TOKEN);
	}
};