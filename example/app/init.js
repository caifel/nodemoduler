module.exports = {
	resources: {
		'Auth': {
			'/auth/signup': 'POST#signup',
			'/auth/login': 'POST#login',
			'/auth/google': 'POST#googleAuth'
		},
		'User': {
			'/user/list': 'GET#getList',
			'/user/get/:id': 'GET#getById'
		}
	},

	middleware: {
		'#authentication': {
			exceptTo: [
				'/auth/google'
			]
		}
	},

	setUpDatabase: function(schemaArgs) {
		var me= this;
		var mongoose = require('mongoose');
		
		mongoose.connect(me.DB_URL);
		mongoose.Promise = require('q').Promise;

		schemaArgs.push(mongoose);
	},

	onModuleReady: function() {
		console.log('The app is ready, do what you please.');
	}

};