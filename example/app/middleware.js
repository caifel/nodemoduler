module.exports = {
	model: [ 'User' ],

	init: function () {
		var me = this;

		me.moment = require('moment');
		me.jwt = require('jwt-simple');
	},

	upload: function (req, res, next) {
		next();
	},

	auth: function (req, res, next) {
		var me = this;
		var payload = null;
		var authorization = req.header('Authorization');
	
		if (!authorization)
			return res.status(401).send({
				message: 'Please make sure your request has an Authorization header'
			});

		try {
			payload = me.jwt.decode(authorization.split(' ')[1], me.SECRET_TOKEN);
		}
		catch (err) {
			return res.status(401).send({
				message: err.message
			});
		}

		if (payload.exp <= me.moment().unix())
			return res.status(401).send({
				error: 'token_expired'
			});

		req.user = payload.sub;

		next();
	}
};