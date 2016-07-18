module.exports = {
	model: [ 'User' ],

	auth: function (req, res, next) {
		var me = this;
		var payload = null;
		var authorization = req.header('Authorization');
	
		if (!authorization)
			return res.status(401).send({
				message: 'Please make sure your request has an Authorization header'
			});
		try {
			payload = me.jwt.decode(authorization.split(' ')[1], me._CONFIG.SECRET_TOKEN);
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

		req.user = payload.sub; /** With this never will be necessary to send user data from ui, because payload.sub is user._id */

		next();
	}
};