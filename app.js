/**
 * Module dependencies.
 */

var express = require('express'),
	controller = require('./rest_controller'),
	http = require('http'),
	path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public/prod/')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

controller.listen(app);
app.get('/', function( req, res ){
	res.send('hello');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});