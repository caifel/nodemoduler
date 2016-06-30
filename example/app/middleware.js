module.exports = {
	models: [
		'User'
	],

	init: function() {
		var me = this;

		var User = me['userModel'];
		me.passport = require('passport');
		me.LocalStrategy = require('passport-local').Strategy;
		me.FacebookStrategy = require('passport-facebook').Strategy;

		// used to serialize the user for the session
		me.passport.serializeUser(function(user, done) {
			done(null, user.id);
		});

		// used to deserialize the user
		me.passport.deserializeUser(function(id, done) {
			User.findById(id, function(err, user) {
				done(err, user);
			});
		});

		me.passport.use(new me.FacebookStrategy(me.facebookAuth, function(token, refreshToken, profile, done) {
			// asynchronous
			process.nextTick(function() {
				// find the user in the database based on their facebook id
				User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err)
						return done(err);

					// if the user is found, then log them in
					if (user) {
						return done(null, user); // user found, return that user
					} else {
						// if there is no user found with that facebook id, create them
						var newUser            = new User();

						// set all of the facebook information in our user model
						newUser.facebook.id    = profile.id; // set the users facebook id
						newUser.facebook.token = token; // we will save the token that facebook provides to the user
						newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
						newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

						// save our user to the database
						newUser.save(function(err) {
							if (err)
								throw err;

							// if successful, return the new user
							return done(null, newUser);
						});
					}

				});
			});
		}));
	},

	main: function(req, res, next) {
		res.status(500).send({
			error: 'token_absent'
		});
	},

	facebookAuth: function () {
		var me = this;

		me.passport.authenticate('facebook', {
			scope : 'email'
		});
	},

	/*app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect : '/profile',
		failureRedirect : '/'
	}));*/
};