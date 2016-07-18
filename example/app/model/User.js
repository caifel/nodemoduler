var bcrypt = require('bcryptjs');

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

		schema.methods.saveWithProvider = function(data, provider) {
			var me = this;
			
			if (provider === 'google') {
				me.google = data.sub;
				me.displayName = me.displayName || data.name;
				me.picture = me.picture || data.picture.replace('sz=50', 'sz=200');
			}
			if (provider === 'github') {
				me.github = data.id;
				me.picture = me.picture || data.avatar_url;
				me.displayName = me.displayName || data.name;
			}

			return me.save();
		};

		schema.methods.comparePassword = function(password, done) {
			bcrypt.compare(password, this.password, function(err, isMatch) {
				done(err, isMatch);
			});
		};

		return mongoose.model('User', schema);
	}
};