module.exports = {
	services: [
		'User'
	],

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
	}
};