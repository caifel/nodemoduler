var bcrypt = require('bcryptjs'); // SHOULD BE POSSIBLE TO HAVE AN INIT IN THE MODEL

module.exports = {
	alias: 'userModel',

	schema: function(mongoose) {
		var schema = mongoose.Schema({
			email: {
				type: String,
				unique: true,
				lowercase: true
			},
			password: {
				type: String,
				select: false
			},
			displayName: String,
			picture: String,
			facebook: String,
			google: String,
			github: String
		});

		schema.pre('save', function(next) {
			var user = this;
			if (!user.isModified('password'))
				return next();
			bcrypt.genSalt(10, function(err, salt) {
				bcrypt.hash(user.password, salt, function(err, hash) {
					user.password = hash;
					next();
				});
			});
		});

		schema.methods.comparePassword = function(password, done) {
			bcrypt.compare(password, this.password, function(err, isMatch) {
				done(err, isMatch);
			});
		};

		return mongoose.model('User', schema);
	}
};