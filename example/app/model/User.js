var bcrypt = require('bcryptjs');

module.exports = {
	alias: 'userModel',

	schema: function(mongoose) {
		var schema = mongoose.Schema({
			email: {
				type: String,
				unique: true,
				required: true,
				lowercase: true
			},
			password: {
				type: String,
				select: false
			},
			name: String,
			google: String,
			picture: String,
			/*country: String,
			locale: String,*/
			gender: String,
			facebook: String,
			last_name: String,
			first_name: String,
			email_verified: {
				type: Boolean,
				'default': false
			}
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

		schema.methods.customSave = function(data, provider) {
			var user = this;

			if (user.isNew) {
				user.email = data.email;
			}

			if (!provider) {
				user.password = data.password;
				user.last_name = data.last_name;
				user.user_name = data.user_name;
				user.first_name = data.first_name;
				user.name = data.first_name + ' ' + data.last_name;
			}
			
			if (provider === 'google') {
				user.google = data.sub;
				user.name = data.name;
				user.email_verified = true;
				user.first_name = data.given_name;
				user.last_name = data.family_name;
				user.picture = data.picture.replace('sz=50', 'sz=200');
			}

			if (provider === 'facebook') {
				user.facebook = data.id;
				user.name = data.name;
				user.email_verified = true;
				user.last_name = data.last_name;
				user.first_name = data.first_name;
				user.displayName = user.displayName || data.name;
				user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + data.id + '/picture?type=large';
			}

			return user.save();
		};

		schema.methods.comparePassword = function(password, done) {
			bcrypt.compare(password, this.password, function(err, isMatch) {
				done(err, isMatch);
			});
		};

		return mongoose.model('User', schema);
	}
};