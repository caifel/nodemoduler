module.exports = {
	// RESOURCES DOESN'T NEED ALIAS

	services: [
		'User'
	],

	getList: function(req, res) {
		var me = this;

		me.userService.getList().then(function(list) {
			res.json({
				success: true,
				list: list
			});
		});
	},

	getById: function(req, res) {
		res.json({
			id: 123456
		});
	}
};