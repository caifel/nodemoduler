**Node Moduler JS**
===================

Node Moduler is a **lightweight** NodeJS Framework for **highly scalable** applications that allows to write **comprehensible code**.

Unlike the common way, "Moduler" (the abbreviation for Node Moduler that will be use in this document) works a lot with *inheritance* and *dependency injection*.

----------


**Installation**
-------------

You can easily add it to your project with the following command.

```
npm install nodemoduler --save
```

**Usage**
-------------

It is important to notice that "Moduler" **works side by side with express**, but to realize how they interact let see it in code.

We start as any application with a **server.js**

```
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
```