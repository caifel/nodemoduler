var express 	= require('express');
var morgan      = require('morgan');
var bodyParser  = require('body-parser');
var nodemoduler = require('nodemoduler');
var server 		= express();

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use(morgan('dev'));

server.use('/api', nodemoduler({
	main: 'init',
	folder: 'app'	
}));

server.listen(3000);

console.log('Server Running');