var express = require('express');
var nodemoduler = require('nodemoduler');
var server = express();

server.use('/api', nodemoduler({
	main: 'init',
	folder: 'app'
}));

server.listen(3000);

console.log('Server Running');