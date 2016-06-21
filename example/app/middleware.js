module.exports = {
	main: function(req, res, next) {
		console.log('MAIN MIDDLEWARE');
		next();
	}
};