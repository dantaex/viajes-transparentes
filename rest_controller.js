/**
*	Viajes transparentes rest API
*	Made by @dantaex
*	
*/

var db = require('./models'),
	sh = require('./lib/sha256'),
	fc = require('./lib/flowcontrol'),
	jade = require('jade'),
	Mailgun = require('mailgun-js'),
	mc = require('./mailconfig.js'),
	mailguy = null;


function listen(app){
	
	//Questions and subscriptions ------------------------------

		/**
		*	GET /questions
		*	List all questons
		*/
		app.get('/questions', function(req,res){ 
			db.questions.find({})
				.populate([
					{path:'_viaje', select:'consecutivo'},
					{path:'from', select:'name'}
				])
				.exec(function(err,doc){
					if(err)	res.send({status:'error', msg: err});
					res.send({status:'success', data: doc});
				});
		});

		/**
		*	GET /travel/here_goes_travel_id/questions
		*	Get all questions belonging to travel with provided id
		*/
		app.get('/travel/:id/questions', function(req,res){ 
			db.questions.find({_viaje:req.params.id})
				.populate([
					{path:'from', select:'name profpic'}
				])
				.exec(function(err,doc){
					if(err)	res.send({status:'error', msg: err});
					res.send({status:'success', data: doc});
				});
		});

		/*
		*	POST /questions
		* 	Creates a new question
		*	If question creator is not a subscriptor yet, create new subscriptor
		*	This is the only POST action that is not restricted
		*
		*	Example request:
		*	{ 
		*	  text: '¿Cuántas personas asistieron al congreso en elq ue impartió una plática?',
		*	  from:
		*	   { email: 'israel@aerostato.mx',
		*	     name: 'Israel Cruz',
		*	     profpic: 'http://graph.facebook.com/v2.1/1477083942567189/picture',
		*	     channel: 'facebook',
		*	     channelData:
		*	      { facebookID: '1477083942567189',
		*	        facebookLink: 'https://www.facebook.com/app_scoped_user_id/1477083942567189/',
		*	        gender: 'male' 
		*	      } 
		*	    }
		*	   to: //servidor ID
		*	   about: //viaje ID 
		*	 }
		*
		*	AngularJS front-end asks Facebook API for profpic and name
		* 	
		*/	
		app.post('/questions',function(req,res){
			//servidor exists?
			db.servidores.findOne({_id:req.body.to},function(err,exists){
				if(exists){

					// Subscriptor exists?
					db.subscriptors.findOne({email:req.body.from.email},function(err,foundSubscriptor){
						if(err)	res.send({status:'error', msg: err});
						else if(!foundSubscriptor){
							//Subscriptor does not exist
							//Add subscriptor
							var subscriptor = new db.subscriptors({
								email : req.body.from.email,
								profpic : req.body.from.profpic,
								name : req.body.from.name,
								channel : req.body.from.channel,
								channelData : req.body.from.channelData,
							});

							//Unsubscribe from general mailing list
							subscriptor.subscribed_to.everything = false;

							//Subscribe specifically to the burocrat they're asking
							subscriptor.subscribed_to.servidores.push(req.body.to);

							//Save subscriptor
							subscriptor.save(function(err,newdoc){
								if(err)	res.send({status:'error', msg: err});
								else{
									createQuestion(req.body,newdoc._id,res);
								}
							});
						} else {
							//Subscriptor exists

							/**
								TODO:
									ACTUALIZAR FOTO del usuario y su nombre, desde los datos de facebook					
							*/
							//Subscribe specifically to the burocrat they're asking
							foundSubscriptor.subscribed_to.servidores.push(req.body.to);
							foundSubscriptor.save();

							createQuestion(req.body,foundSubscriptor._id,res);
						}
					});

				} else {
					res.send({status:'error',message:'servidor does not exist'});
				}
			});
		});
		
		function createQuestion(body,from,res){
			//Create question
			var question = new db.questions({
				_viaje : body.about,
				from: from,
				to: body.to,
				text: body.text
			});
			question.save(function(err,newquestion){
				if(err) res.send({status:'error',msg:err});
				else{
					res.send({status:'success',lastid:newquestion.id});
					//save question to travel
					db.viajes.findOne({_id:body.about},function(err,viaje){
						if(viaje){
							if(viaje.questions){
								viaje.questions.push(newquestion._id);
							} else{
								viaje.questions = [newquestion._id];
							}
							viaje.save();
						}
					});
				} 
			});			
		}

		/**
		*	POST /subscriptons
		*	Creates new subscription
		*/
		app.post('/subscriptions', function(req,res){
			//Check if user already exists
			db.subscriptors.findOne({email:req.body.email},function(err,subscriptor){
				if(err) res.send({status:'error',msg:err});
				else if(subscriptor){
					//user exists
					if(req.body.servidor){
						//specific subscription
						//so find servidor
						db.servidores.findOne({_id:req.body.servidor},function(err,foundServidor){
							if(err || !foundServidor) res.send({status:'error',message:'servidor not found'});
							else{
								subscriptor.subscribed_to.servidores.push(foundServidor._id);
								subscriptor.save(function(err,newdoc){
									if(err){
										res.send({status:'error', message:'Error while saving susbcriptor'});
									} else {
										updateMailingList(foundServidor._id,subscriptor);
										sendConfirmationEmail(subscriptor,foundServidor);
										res.send({status:'success', lastid: subscriptor.id});
									}
								});
							}
						});
					} else {
						//general subscription, and this guy was already general subscribed
						res.send({status:'success', lastid: subscriptor.id});
					}
				} else {
					//new user
					if(req.body.servidor){
						//spcecific sub
						//so find servidor
						db.servidores.findOne({_id:req.body.servidor},function(err,foundServidor){
							if(err || !foundServidor) res.send({status:'error',message:'servidor not found'});
							else{
								var new_subscriptor = new db.subscriptors({email: req.body.email});
								new_subscriptor.subscribed_to.everything = false;
								new_subscriptor.subscribed_to.servidores.push(foundServidor._id);
								new_subscriptor.save(function(err,newdoc){
									if(err){
										res.send({status:'error', message:'Error while saving susbcriptor'});
									} else if(newdoc){
										updateMailingList(foundServidor._id,newdoc);
										sendConfirmationEmail(newdoc,foundServidor);
										res.send({status:'success', lastid: newdoc.id});
									} else {
										//this should never ever happen
										res.send({status:'error', message: 'Totally unknown error when saving subscriptor:204'});
									} 
								});
							}
						});

					} else {
						//general susbcription
						var new_subscriptor = new db.subscriptors(req.body);
						new_subscriptor.save(function(err,newdoc){
							if(err)	res.send({status:'error', msg: err});
							else{

								//Inform client (browser)
								res.send({status:'success', lastid: newdoc.id });

								//Send first email announcing subscription
								mailgun = new Mailgun({apiKey: mc.api_key, domain: mc.domain});
								mailgun.lists(mc.mailingList)
									.members().add({ members: [{address: newdoc.email}], subscribed: true }, function (err, body) {
									if (err) console.log('Mailgun mailing list error',err);
									else {
										//send email
										sendConfirmationEmail(newdoc);
									}
								});
							}
						});						
					}
				}
			});
		});

	
	// Users (Servidores públicos que suben datos) --------------------------------

		/**
		*	GET /users/here_goes_user_id
		*	RESTRICTED ACCESS
		*	List users and their permissions
		*/
		app.get('/users/:id', restrictedAccess, function(req,res){ 
			db.users.findOne({id:req.params.id})
				.select('name email permissions -_id')
				.populate([
					{path:'permissions.auth_servidores', select:'nombre'},
					{path:'permissions.auth_instituciones', select:'nombre'},
					{path:'permissions.auth_viajes',select:'tipo_viaje _origen _destinos comision'}
				])
				.exec(function(err,doc){
					if(err)	res.send({status:'error', msg: err});
					res.send({status:'success', data: doc});
				});
		});

	// States --------------------------------
		app.get('/states', function(req,res){ 
			db.ciudades.find({})
				.populate('_visitas')
				.exec(function(err,cities){
					if(err) res.send({status:'error',message:'kaboom'});
					else{
						fc.taskMap(
							cities,
							function(city,next){
								var obcity = city.toObject();
								
								var totalSpent = 0;
								obcity.totalSpent = totalSpent;
								if(obcity._visitas){
									for (var i = obcity._visitas.length - 1; i >= 0; i--) {
										var viaticos  = obcity._visitas[i].gastos.viaticos || 0,
											pasaje 	  = obcity._visitas[i].gastos.pasaje || 0,
											hospedaje = obcity._visitas[i].gastos.hospedaje || 0;
										totalSpent = viaticos*1 + pasaje*1 + hospedaje*1;
									};
									obcity._visitas = null;
									obcity.totalSpent = totalSpent;
									next(err,obcity);
								} else {
									next(err,obcity);
								}
							},
							function(err,things){
								if(err) res.send({status:'error',message:'woops!'});
								else res.send({status:'success',data:things});
							}
						);
					} 
				});
		});

	// Cities --------------------------------

		/**
		*	GET /cities
		*	List cities
		*/
		app.get('/cities', function(req,res){ sendAll(db.ciudades,res) });

		/**
		*	GET cities/here_goes_city_id
		*	List all trips whose destination is specified city
		*/
		app.get('/cities/:id', function(req,res){ 
			db.ciudades.findOne({_id:req.params.id},function(err,doc){
				if(err) res.send({status:'error',msg:err});
				else if(!doc) res.send({status:'success',data:doc});
				else{
					db.viajes.find({ _origen: doc._id })
						.populate('_destinos _institucion_hospedaje _institucion_pasaje')
						.exec(function(err,docs){
							if(err) res.send({status:'error', msg: err});
							else res.send({ 
								status:'success',
								data : {
									ciudad : doc,
									viajes_salientes : docs
								}
							});
						});
				}
			});		
		});

		/**
		*	POST /cities
		*   RESTRICTED ACCESS
		*   Create new City
		*/
		app.post('/cities', restrictedAccess, function(req,res){
			upsert(
				db.ciudades,
				{ ciudad : req.body.ciudad },
				req.body,
				res
			);
		});

	// Institutons ---------------------------

		/**
		*	GET /institutions
		*	List institutions
		*/
		app.get('/institutions', function(req,res){ sendAll(db.instituciones,res) });

		/**
		*	POST /institutions
		*	RESTRICTED ACCESS
		*	Create institution	
		*/
		app.post('/institutions', restrictedAccess , function(req,res){
			upsert(
				db.instituciones,
				{ nombre : req.body.nombre },
				req.body,
				res
			);
		});	

	// Travellers (Servidores) ------------------------------

		/**
		*	GET /travellers
		*	List travellers
		*	Debería mostrar los correos electrónicos?
		*/
		app.get('/travellers', function(req,res){ 
			var limit = req.query.limit || 10,
				term = new RegExp(req.query.term,'i');

			db.servidores.find({ nombre: term, nviajes: { $gte : 0} })
				.limit(limit)
				.populate('_institucion')
				.select('-email')
				.exec(function(err,docs){
					if(err) res.send({status:'error', msg: err});
					else res.send({ status:'success', data : docs});
				});
		});


		/**
		*	GET /travellers/here_goes_traveller_id
		*	Get all the information from specified traveller
		*/
		app.get('/travellers/:id', function(req,res){ 
			db.servidores.findOne({_id:req.params.id})
				.select('-motivo')
				.populate('_institucion')
				.exec(function(err,doc){
					if(err) res.send({status:'error',msg:err});
					else if(!doc) res.send({status:'success',data:doc});
					else{
						db.viajes.find({ _servidor: doc._id })
							.populate('_destinos _origen _institucion_hospedaje _institucion_pasaje')
							.exec(function(err,docs){
								if(err) res.send({status:'error', msg: err});
								else{
									var traveller = doc.toObject();
									traveller._viajes = docs;
									res.send({ 
										status:'success',
										data : traveller
									});
								}
							});
					}
				});
		});

		/**
		*	POST /traveller 
		*	RESTRICTED ACCESS
		*	Create Traveller
		*/
		app.post('/travellers', restrictedAccess , function(req,res){
			upsert(
				db.servidores,
				{ nombre : req.body.nombre },
				req.body,
				res
			);
		});	

	// Viajes ----------------------------------

		/**
		*	GET /Travel
		*	List trips
		*	Optional filtering:
		*
		*	by: what to filter by
		*	/travel?by=eventos
		*	/travel?by=inicio
		*	/travel?by=destinos
		*	/travel?by=servidores
		*	
		*	term: string to look for
		*	/travel?term=the%20uri%20formatted%20string%20you%20are%20looking%20for
		*		
		*	limit: specify a limit
		*	/travel?limit=30
		*
		*/
		app.get('/travel', function(req,res){ 
			
			var limit = req.query.limit || 10;

			if(!req.query.by) findViajes({},res,null,limit);
			else
				db.viajes.find(req.query,function(err,docs){

					var term = new RegExp(req.query.term,'i');
					switch(req.query.by){
						case 'eventos':
							findViajes({'evento.nombre':term},res,null,limit);
						break;
						//between
						case 'inicio':
							if( (new Date(req.query.beg)).getDay() != NaN && (new Date(req.query.end)).getDay() != NaN ){
								findViajes({
									'comision.inicio' : {
										$gte: new Date(req.query.beg),
										$lt: new Date(req.query.end)
									}},res,null,limit);
							}
							else res.send({status:'error', msg : 'Invalid date' });
						break;
						case 'destinos':
							if(req.query.full)
								findRelated( db.ciudades.find({ciudad:term}) , '_destinos' , res, limit, 'full');
							else	
								findRelated( db.ciudades.find({ciudad:term}) , '_destinos' , res, limit);
						break;
						case 'servidores':
							findRelated( db.servidores.find({nombre:term}) , '_servidor' , res, limit);
						break;
						default:
							res.send({status:'success', data: [] });
						break;
					}
				});
		});

		/**
		*	GET /travel/here_goes_travel_id
		*	Get all the information for specified trip
		*/
		app.get('/travel/:id', function(req,res){ 
			db.viajes.findOne({_id:req.params.id})
				.populate('_servidor _destinos _origen _institucion_hospedaje _institucion_pasaje')
				.exec(function(err,docs){
					if(err) res.send({status:'error', msg: err});
					else res.send({ status:'success', data : docs});
				});
		});

		/**
		*	POST /travel
		*	RESTRICTED ACCESS
		*	Create trip (Dar de alta viaje)
		*/
		app.post('/travel', restrictedAccess , function(req,res){
			var doc = new db.viajes(req.body);
			doc.save(function(err,newborn){
				if(err)	res.send({status:'error', msg: err});
				else{
					res.send({status:'success', lastid: newborn.id });

					//TODO:
					/*

						Enviar noitficación al mailinglist del servidor público!

					*/

				} 
			});
		});
	
	//Misc -------------------------------------

		/**
		*	GET /chartdata
		*	Chart data...
		*/
		app.get('/chartdata', function(req,res){
			db.viajes.find(
					{},
					'comision.inicio _id',
					function(err,docs){
						if(err)	res.send({status:'error', msg: err });
						else res.send({status:'success', data: docs});
					}
				);
		}); 

		/**
		*	GET /suggestions
		*	Typeahead/autocomplete thing
		*/
		app.get('/suggestions', function(req,res){ 
			fc.taskMap(
				[
					db.servidores.find({}).select('_id nombre'),
					db.ciudades.find({}).select('_id ciudad'),
					db.viajes.find({}).select('_id evento.nombre')
				],
				function(query,next){
					query				
					.limit(100)
					.exec(function(err,docs){
						next(err,docs);
					});
				}, 
				function(err,results){
					if(err)	res.send({status:'error', msg: err});
					else res.send({status:'success', data: results });
				}
			);
		});

}


// Utils :::

/*
* Find filtered
*/
function findRelated(query,filter,res,limit,full){
	query.limit(limit)
		.exec(function(err,docs){
			if(err)	res.send({status:'error', msg: err});
			else if(!docs) res.send({status:'success', data: [] });
			else{
				//for each matching guy, get all of their travels
				fc.taskChain(
					docs,
					function(docc,callback,ndocs,vars){
						if(ndocs >= vars.limit)
							callback(null,null);
						else{
							var ff = {};
							ff[filter] = docc._id;
							findViajes(ff,null,function(err,ress){
								callback(err,ress);
							},vars.limit,full);
						}
					},
					function(err,allResults){
						if(err) res.send({status:'error', msg: err});
						else res.send({status:'success', items: allResults.length, data : allResults});
					},
					{
						acceptnull: false,
						mergeArrayResults : true,//merge them!
						transport : {
							limit : limit
						}
					}
				);
			}
		});	
}

/**
*	Shortcut
*/
function findViajes(filter,res,callback,limit,full){

	var query =	db.viajes.find(filter);
	if(!full){
		query = query.select({
			'tipo_viaje':true,
			'_origen':true,
			'_destinos':true,
			'_servidor':true,
			'gastos':true,
			'pasaje':true,
			'comision':true,
			'consecutivo':true,
			'oficio':true,
			'evento.nombre' : true,
			'hotel' : true
		});
	}

	query.populate([
			{path:'_servidor',select:'nombre'},
			{path:'_destinos',select:'ciudad pais _id'},
			{path:'_origen',select:'ciudad pais -_id'}
		])
		.limit(limit)
		.exec(function(err,docs){
			if(callback && typeof callback == 'function')
				callback(err,docs);
			else{
				if(err) res.send({status:'error', msg: err});
				else res.send({ status:'success', items: docs.length, data : docs});
			}				
		});		
}

/**
*	Shortcut
*/
function sendConfirmationEmail(subscriptor, subscribed_to){

	if(!mailguy)
		mailguy = new Mailgun({apiKey: mc.api_key, domain: mc.domain});

	//send email
	jade.renderFile('views/mailthanks.jade', 
		{ email : subscriptor.email, subscribed_to: subscribed_to }, 
		function(err, html){
			var message = html || '¡Gracias por suscribirse a Viajes Transparentes!',
				data = {
					from: mc.from_who,
					to: subscriptor.email,
					subject: 'Su suscripción a Viajes Transparentes',
					html: message
				};
			mailguy.messages().send(data, function (err, body) {
				if (err) console.log("Got an error: ", err);
				else console.log('Got a new guy subscribed!');
			});
		});
}


/**
*	Shortcut
*/
function updateMailingList(servidor_id,subscriptor){
	/**
	
	TODO

	Create and maintain mailgun mailing lists for each servidor
	to increase efficiency

	*/	
}

/**
*	Shortcut
*/
function sendAll(model,res){
	model.find({},{__v:false},function(err,docs){
		if(err) res.send({status:'error', msg: err});
		else res.send({ status:'success', data : docs});
	});	
}

/**
*	Shortcut
*/
function upsert(model,filter,fields,res){
	model.findOne(filter,function(err,doc){
		if(doc)
			res.send({status:'success', lastid: doc.id });
		else{
			var doc = new model(fields);
			doc.save(function(err,newborn){
				if(err)	res.send({status:'error', msg: err});
				else res.send({status:'success', lastid: newborn.id });
			});
		}
	});
}

//:::::::::::::: Security ::::::::::::::
/*
*	HMAC (hash message authentication code) Auth
*	How this auth works?
*
*	The Server and Client know a PUBLIC KEY (username) and a PRIVATE KEY (password)
*	The Client sends a HASH (accesstoken) with EVERY request, which is a hashed combination of their password
*		and the actual request data.
*	The Server receives the request data and hashes it with user's stored password, 
*		then compares both signatures
*
*	This way the REST server is completely STATELESS, as it should be in a REST environment
*/
function restrictedAccess(req,res,next){
	db.users.findOne({ id : req.query.publickey },function(err,user){
		if(err || !user) res.send({status:'error', message : 'User not found'});
		else{
			var data = req.query.data || JSON.stringify(req.body);
			var hash = sh.hash( user.password + data);
			if(hash == req.query.accesstoken) next();
			else res.send({status:'error',message:'access denied; invalid access token'});
		}
	});
}

exports.listen = listen;