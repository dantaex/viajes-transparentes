/**
* Viajes transparentes rest API
*/

var db = require('./models'),
	sh = require('./lib/sha256'),
	fc = require('./lib/flowcontrol'),
	jade = require('jade'),
	Mailgun = require('mailgun-js');

//Your api key, from Mailgun’s Control Panel
var api_key = 'key-8q8i2vy87lzsnudd9-gegjlcp64e-c54';

//Your domain, from the Mailgun Control Panel
var domain = 'sandbox7447fa2019f34f97b88e55ba09346ea8.mailgun.org';

//Your sending email address
var from_who = 'suscripciones@sandbox7447fa2019f34f97b88e55ba09346ea8.mailgun.org';

var mailingList = 'viajestransparentes@sandbox7447fa2019f34f97b88e55ba09346ea8.mailgun.org';

function listen(app){
	
	//the vero only post action that is not restricted
	app.post('/subscriptions', function(req,res){
		db.subscriptors.findOne({email:req.body.email},function(err,doc){
			if(err) res.send({status:'error',msg:err});
			else if(doc) res.send({status:'exception',msg:'already subscribed'});
			else{
				var doc = new db.subscriptors(req.body);
				doc.save(function(err,newdoc){
					if(err)	res.send({status:'error', msg: err});
					else{
						res.send({status:'success', lastid: newdoc.id });

						mailgun = new Mailgun({apiKey: api_key, domain: domain});
										
						//For the sake of this tutorial you need to create a mailing list on Mailgun.com/cp/lists and put its address below
						mailgun.lists(mailingList)
							.members().add({ members: [{address: newdoc.email}], subscribed: true }, function (err, body) {
							if (err) console.log('Mailgun mailing list error',err);
							else {
								//send email
								jade.renderFile('views/mailthanks.jade', { email : newdoc.email }, function(err, html){
									var message = html || '¡Gracias por suscribirse a Viajes Transparentes!',
										data = {
											from: from_who,
											to: newdoc.email,
											subject: 'Su suscripción a Viajes Transparentes',
											html: message
										};
									mailgun.messages().send(data, function (err, body) {
										if (err) console.log("Got an error: ", err);
										else console.log('Got a new guy subscribed!');
									});
								});
							}
						});

					}
				});
			}
		});
	});

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
	// Users --------------------------------
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
			})
	});

	// Ciudades --------------------------------
	app.get('/cities', function(req,res){ sendAll(db.ciudades,res) });
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
	app.post('/cities', restrictedAccess, function(req,res){
		upsert(
			db.ciudades,
			{ ciudad : req.body.ciudad },
			req.body,
			res
		);
	});

	// Instituciones ---------------------------
	app.get('/institutions', function(req,res){ sendAll(db.instituciones,res) });
	app.post('/institutions', restrictedAccess , function(req,res){
		upsert(
			db.instituciones,
			{ nombre : req.body.nombre },
			req.body,
			res
		);
	});	

	// Servidores ------------------------------
	app.get('/travellers', function(req,res){ sendAll(db.servidores,res) });
	app.get('/travellers/:id', function(req,res){ 
		db.servidores.findOne({_id:req.params.id},function(err,doc){
			if(err) res.send({status:'error',msg:err});
			else if(!doc) res.send({status:'success',data:doc});
			else{
				db.viajes.find({ _servidor: doc._id })
					.populate('_destinos _origen _institucion_hospedaje _institucion_pasaje')
					.exec(function(err,docs){
						if(err) res.send({status:'error', msg: err});
						else res.send({ 
							status:'success',
							data : {
								servidor : doc,
								viajes : docs
							}
						});
					});
			}
		});
	});
	app.post('/travellers', restrictedAccess , function(req,res){
		upsert(
			db.servidores,
			{ nombre : req.body.nombre },
			req.body,
			res
		);
	});	

	// Viajes ----------------------------------
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
	app.get('/travel/:id', function(req,res){ 
		db.viajes.findOne({_id:req.params.id})
			.populate('_servidor _destinos _origen _institucion_hospedaje _institucion_pasaje')
			.exec(function(err,docs){
				if(err) res.send({status:'error', msg: err});
				else res.send({ status:'success', data : docs});
			});
	});
	app.post('/travel', restrictedAccess , function(req,res){
		var doc = new db.viajes(req.body);
		doc.save(function(err,newborn){
			if(err)	res.send({status:'error', msg: err});
			else{
				res.send({status:'success', lastid: newborn.id });

				//send emial to subscriptors
				//RENDER POR JADE DEL NUEVO VIAJE...
				//POR AHORA TEXTO PLANI?
				// var message = html || '¡Gracias por suscribirse a Viajes Transparentes!',
				// 	data = {
				// 		from: from_who,
				// 		to: mailingList,
				// 		subject: 'Un nuevo viaje ha sido publicado',
				// 		html: message
				// 	};
				// mailgun.messages().send(data, function (err, body) {
				// 	if (err) console.log("Got an error: ", err);
				// 	else console.log('Got a new guy subscribed!');
				// });

			} 
		});
	});
	

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
* In order To make autocomplete super fast
* we only send the first 10 results
*/
function findRelated(query,filter,res,limit){
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
							},vars.limit);
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

function findViajes(filter,res,callback,limit){
	db.viajes.find(filter)
		.select({
			'tipo_viaje':true,
			'_origen':true,
			'_destinos':true,
			'_servidor':true,
			'gastos':true,
			'pasaje':true,
			'comision':true,
			'evento.nombre' : true
		})
		.populate([
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

function sendAll(model,res){
	model.find({},{__v:false},function(err,docs){
		if(err) res.send({status:'error', msg: err});
		else res.send({ status:'success', data : docs});
	});	
}

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

// Security :::
/*
 How this auth works?

	The Server and Client know a PUBLIC KEY (username) and a PRIVATE KEY (password)
	The Client sends a HASH (accesstoken) with EVERY request, which is a hashed combination of their password
		and the actual request data.
	The Server receives the request data and hashes it with user's stored password, 
		then compares both signatures

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