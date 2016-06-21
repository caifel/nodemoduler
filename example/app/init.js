module.exports = {
	resources: {
		'Auth': {
			'/auth/signup': 'POST#signup',
		},
		'User': {
			'/user/list': 'POST#getList',
			'/user/get/:id': 'GET#getById',
		}
	},

	middleware: {
		'#main': '*'
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