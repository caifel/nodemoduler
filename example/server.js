var express 	= require('express');
var morgan      = require('morgan');
var moduler = require('nodemoduler');
var bodyParser  = require('body-parser');
var server 		= express();

server.use(bodyParser.urlencoded({
	extended: true
}));
server.use(bodyParser.json());
server.use(morgan('dev'));

server.use('/api', moduler({
	main: 'init',
	folder: 'app'	
}));

server.listen(3000);
console.log('Server Running');