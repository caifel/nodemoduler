module.exports = {
	alias: 'userService',
	model: [ 'User' ],
	mixin: [ 'Calculation' ],
	
	init: function () {
		console.log('You are in User Service');	
	},

	createUser: function(user) {
		var me = this;
		var newUser = me['userModel'](user);

		return me['userModel'].findOne({
			name: user.name
		}).then(function (user) {
			if (user)
				return 'The user is already register';
			return newUser.save();
		});
	},

	getList: function() {
		var me = this;

		return me['userModel'].find({}).then(function(list) {
			return list.concat([1, 2, 3]); 
		});
	},
	
	getUser: function (id) {
		var me = this;
		
		return me['userModel'].findById(id);
	}

};