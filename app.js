/**
 * Module dependencies.
 */

var express = require('express'),
	controller = require('./rest_controller'),
	http = require('http'),
	path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use( require('stylus').middleware(__dirname+'/public/prod/') );
app.use(express.static(path.join(__dirname, 'public/prod/')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//View locals
app.locals._      = require('underscore');
app.locals._.str  = require('underscore.string');
app.locals.moment = require('moment');

var db = require('./models');

controller.listen(app);

function home( req, res ){	
	db.viajes.find({})
		.select({
			'tipo_viaje':true,
			'_origen':true,
			'_destinos':true,
			'_servidor':true,
			'gastos':true,
			'pasaje':true,
			'comision':true
		})
		.populate([
			{path:'_servidor',select:'nombre'},
			{path:'_destinos',select:'ciudad pais -_id'},
			{path:'_origen',select:'ciudad pais -_id'}
		])
		.limit(10)
		.exec(function(err,docs){
			if(req.params.travelid){
				db.viajes.findOne({_id:req.params.travelid})
					.populate('_servidor _destinos _origen _institucion_hospedaje _institucion_pasaje')
					.exec(function(err,doc){
						if(err) res.render('app',{data:docs});
						else res.render('app',{data:docs,initialData:doc});
					});
			}
			else res.render('app',{data:docs});
		});	
}
app.get('/', home);
app.get('/:travelid', home);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});