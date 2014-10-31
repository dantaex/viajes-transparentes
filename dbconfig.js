/**
*
*	Database configuration for Viajes Transparentes
*	Made by @dantaex
*
*/

var mongoose = require('mongoose');
var db_local_server = 'mongodb://localhost:27017/viajes';

var db_remote_server = 'mongodb://USERNAME:PASSWORD@MONGO_SERVER:MONGO_PORT/DATABASE_NAME';

mongoose.connection.on(
	'open', 
	function(){
		console.log('Connected to '+db_remote_server);
	}
);

mongoose.connection.on(
	'error', 
	function (err) { 
		console.log('Mongoose connection error: ' + err);
	}
);

mongoose.connect(db_remote_server);

exports.mongoose = mongoose;
exports.Schema = mongoose.Schema;
exports.ObjectId = mongoose.Schema.ObjectId;