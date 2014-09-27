/**
*
*	Database configuration for Viajes Transparentes
*	Made by @dantaex
*
*/

var mongoose = require('mongoose');
var db_server = 'mongodb://localhost:27017/viajes';

mongoose.connection.on(
	'open', 
	function(){
		console.log('Connected to '+db_server);
	}
);

mongoose.connection.on(
	'error', 
	function (err) { 
		console.log('Mongoose connection error: ' + err);
	}
);

mongoose.connect(db_server);

exports.mongoose = mongoose;
exports.Schema = mongoose.Schema;
exports.ObjectId = mongoose.Schema.ObjectId;