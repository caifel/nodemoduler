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
var express = require('express');
var nodemoduler = require('nodemoduler'); // That's how we include it.
var server = express();


server('/api', nodemoduler({
	main: 'init', // Define the main file.
	folder: 'app' // Define the folder where lies the module.
}));

/* "Moduler" can be use as many times as modules you have:
	server('/api', nodemoduler({
		main: 'init', // Define the main file.
		folder: 'admin' // Define the folder where lies the module.
	}));
	...
*/

server.listen(3000);

console.log('Server Running');
```