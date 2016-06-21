module.exports = {
	services: [
		'User'
	],

	signup: function(req, res) {
		var me = this;
		console.log(req);

		me.userService.createUser(req.body).then(function(response) {
			console.log(response);
			res.json({
				success: true,
				message: 'You had Signed up correctly'
			});
		});
	}
};