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

	setDBOptions: function() {
		var mongoose = require('mongoose');
		mongoose.connect('mongodb://tutorial:tutorial@ds025772.mlab.com:25772/tutorial');
		
		return {
			orm: mongoose
		};
	},

	onAppReady: function() {
		console.log('The app is ready, do what you please.');
	}

};