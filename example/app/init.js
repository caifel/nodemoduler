module.exports = {
	resource: {
		'Auth': {
			'/auth/login': 'POST#login',
			'/auth/signup': 'POST#signup',
			'/auth/github': 'POST#githubAuth',
			'/auth/google': 'POST#googleAuth',
			'/auth/facebook': 'POST#facebookAuth'
		},
		'User': {
			'/user/list': 'GET#getList',
			'/user/get/:id': 'GET#getById'
		}
	},

	/**
	 * Middleware support the following cases:
	 * 		"All"
	 * 			--> Eg. '#fn': '*'
	 *		"All those who"
	 *			--> Eg. '#fn': '/api/list' 		[Declaring explicitly the route]
	 *			-->	Eg. '#fn': '/api/get/:id' 	[Declaring explicitly the route with params]
	 *			-->	Eg. '#fn': 'get*' 			[Insensitive, will match all those who has the word "get"]
	 *		"All except those who"
	 *			Same as "All those who" but adding the "-" at the start.
	 *			--> Eg. '#fn': '-/api/list'
	 *			-->	Eg. '#fn': '-/api/get/:id'
	 *			-->	Eg. '#fn': '-get*'
	 *		It's also possible pass an array of routes using:
	 *			--> Eg. '#fn': { applyTo: ['route1', route2 ] }
	 *			--> Eg. '#fn': { exceptTo: ['route1', route2 ] }
	 *				In the above cases, "route1", "route2", ... "routeN"
	 *				can be explicit, with params and/or insensitive (same for all).
	 * */
	middleware: {
		'#auth': '-auth*'
	},
	
	/**
	 * The keys - values defined in "global" are going to be available
	 * inside the scope of every resource, service, model or require.
	 * */
	global: {
		q: require('q').Promise,
		moment: require('moment'),
		jwt: require('jwt-simple'),
		_CONFIG: require('./config')
	},

	/**
	 * Setting up any kind of DB. (Most commonly used mongoose)
	 * @param schemaArgs:
 	 * 			Is an array where each item will be passed as an
 	 * 			arguments to the "schema" method that all models must have.
	 *
	 * 			Eg. schemaArg = ['Hello', 'World'] will pass arguments
	 * 				to ALL the models: schema: function(param_1, param_2) { ... }
	 *
	 * */
	setupDB: function(schemaArgs) {
		var me = this;
		var mongoose = require('mongoose');
		
		mongoose.connect(me._CONFIG.DB_URL);
		mongoose.Promise = me.q;

		schemaArgs.push(mongoose);
	},

	/**
	 * Callback called when "nodemoduler" have finished setting up everything
	 * Consider that "ready" is call before all the init methods.
	 * 			"Every resource, service, model,
	 * 		and/or require can have an "init" method"
	 * */
	ready: function() {
		console.log('The app is ready, do what you please.');
	}

};