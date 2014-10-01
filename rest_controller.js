/**
* Viajes transparentes rest API
*/
//Yes I'm lazy

var db = require('./models');
var sh = require('./sha256');

function listen(app){
	
	// Ciudades --------------------------------
	app.get('/ciudades', function(req,res){ sendAll(db.ciudades,res) });
	app.get('/ciudades/:id', function(req,res){ 
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
	app.post('/ciudades', restrictedAccess, function(req,res){
		upsert(
			db.ciudades,
			{ ciudad : req.body.ciudad },
			req.body,
			res
		);
	});

	// Instituciones ---------------------------
	app.get('/instituciones', function(req,res){ sendAll(db.instituciones,res) });
	app.post('/instituciones', restrictedAccess , function(req,res){
		upsert(
			db.instituciones,
			{ nombre : req.body.nombre },
			req.body,
			res
		);
	});	

	// Servidores ------------------------------
	app.get('/servidores', function(req,res){ sendAll(db.servidores,res) });
	app.get('/servidores/:id', function(req,res){ 
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
	app.post('/servidores', restrictedAccess , function(req,res){
		upsert(
			db.servidores,
			{ nombre : req.body.nombre },
			req.body,
			res
		);
	});	

	// Viajes ----------------------------------
	//Send compact list 
	app.get('/viajes', function(req,res){ 
		findViajes({},res);
	});
	app.get('/viajes/:id', function(req,res){ 
		db.viajes.findOne({_id:req.params.id})
			.populate('_servidor _destinos _origen _institucion_hospedaje _institucion_pasaje')
			.exec(function(err,docs){
				if(err) res.send({status:'error', msg: err});
				else res.send({ status:'success', data : docs});
			});
	});

	app.post('/viajes', restrictedAccess , function(req,res){
		var doc = new db.viajes(req.body);
		doc.save(function(err,newborn){
			if(err)	res.send({status:'error', msg: err});
			else res.send({status:'success', lastid: newborn.id });
		});
	});


	app.get('/search', function(req,res){
		db.viajes.find(req.query,function(err,docs){
			var term = new RegExp(req.query.term,'i');
			switch(req.query.by){
				case 'eventos':
					findViajes({'evento.nombre':term},res);
				break;
				//between
				// case 'inicio':
				// 	query = db.viajes.find({:term});
				// break;
				case 'destinos':
					db.ciudades.findOne({ciudad:term},function(err,doc){
						console.log('ciudad encontrada');
						console.log(doc);
						if(err)	res.send({status:'error', msg: err});
						else if(!doc) res.send({status:'success', data: [] });
						// else findViajes({_destinos:db.mongoose.Types.ObjectId(doc._id)},res);
						// else findViajes({_destinos:{'$in':[doc._id]} },res);
						else{
							var shit1 = '5428dafdb7f7f849f6286bdd';
							var shit2 = doc._id;
							console.log('what:');
							console.log(shit1);
							console.log(shit2);
							db.viajes.find({_destinos:shit2},function(err,docs){
								res.send({message:'WHATEVA!',docs:docs});
							});
						}
					});
				break;
				case 'servidores':
					db.servidores.findOne({nombre:term},function(err,doc){
						if(err)	res.send({status:'error', msg: err});
						else if(!doc) res.send({status:'success', data: [] });
						else findViajes({_servidor:doc._id},res);
					});
				break;
				default:
					res.send({status:'success', data: [] });
				break;
			}
		});
	});	
}


// Utils :::
function findViajes(query,res){
	console.log('FILTROOO');
	console.log(query);
	db.viajes.find(query)
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
			{path:'_destinos',select:'ciudad pais _id'},
			{path:'_origen',select:'ciudad pais -_id'}
		])
		.exec(function(err,docs){
			if(err) res.send({status:'error', msg: err});
			else res.send({ status:'success', items: docs.length, data : docs});
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
			var hash = sh.hash( user.password + JSON.stringify(req.body) );
			// console.log( JSON.stringify(req.body) );
			if(hash == req.query.accesstoken){
				next();
			}
			else 
				res.send({status:'error',message:'access denied; invalid access token'});
		}
	});
}

exports.listen = listen;