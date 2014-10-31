/**
 * Module dependencies.
 */

var express = require('express'),
	controller = require('./rest_controller'),
	http = require('http'),
	fc = require('./lib/flowcontrol'),
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

function home( req, res, section ){	
	//count things
	fc.taskMap(
		[
			db.ciudades.count(),
			db.viajes.count(),
			db.servidores.count(),
			//db.ciudades.find().select('ciudad _visitas nvisitas').sort({ nvisitas: -1 }).limit(3),
			db.viajes.find({})
				.select('_destinos gastos')
				.populate('_destinos')
				.sort({ 'gastos.total_mx': -1 })
				.limit(7),
			db.meta.find().select('-_id')
		],
		function(query,next){
			query
			.exec(function(err,docs){
				next(err,docs);
			});
		}, 
		function(err,counts){
			if(err)	res.render('app',{section:section,counts:[98,44,76,[],1.4]})
			else{						
				if(req.params.travelid){
					db.viajes.findOne({_id:req.params.travelid})
						.populate('_servidor _destinos _origen _institucion_hospedaje _institucion_pasaje')
						.exec(function(err,doc){
							if(err) res.render('app',{section:section,counts:counts});
							else res.render('app',{initialData:doc,section:section,counts:counts});
						});
				} else if (req.params.travellerid){

					//PASAR ESTO A REST_CONTROLLER
					db.servidores.findOne({_id:req.params.travellerid})
					.populate('_institucion')
					.exec(function(err,doc){
						if(err) res.render('app',{section:section,counts:counts});
						else if (!doc) res.render('app',{section:'welcome_panel',counts:counts});
						else{
							db.viajes
								.find({ _id:{ $in: doc._viajes} })
								.populate('_destinos')
								.exec(function(err,docs) {
									if(err) res.render('app',{initialData:doc,section:section,counts:counts});
									else{
										var traveller = doc.toObject();
										traveller._viajes = docs;
										res.render('app',{initialData:traveller,section:section,counts:counts});
									}
								});
						} 
					});
				} else res.render('app',{section:section,counts:counts});
			}			
		}
	);
}

app.get('/', function(req,res){ home(req,res,'welcome_panel') } );
app.get('/buscar', function(req,res){ home(req,res,'search_panel'); });
app.get('/viajes', function(req,res){ home(req,res,'travel_panel'); });
app.get('/graficas', function(req,res){ home(req,res,'chart_panel'); });
app.get('/viajes/:travelid', function(req,res){ home(req,res,'travel_panel'); });
app.get('/servidores/:travellerid', function(req,res){ home(req,res,'traveller_panel'); });
app.get('/adm', function(req,res){ res.render('adminapp') });
app.get('/rest', function(req,res){ res.render('rest') });
app.get('/mapa', function(req,res){ home(req,res,'map_panel'); });



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});