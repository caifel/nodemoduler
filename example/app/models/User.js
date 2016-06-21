module.exports = {
	alias: 'userModel',

	schema: function(mongoose) {
		var schema = mongoose.Schema({
			name: String
		});

		// You can add custom methods to your schema or
		// any other kind of staff that mongoose allows,
		// but the only thing that matters to "Node Moduler"
		// is you to return the "model", in order to
		// inject it in resources, services, middleware or
		// any kind of requires.
		return mongoose.model('User', schema);
	}
};