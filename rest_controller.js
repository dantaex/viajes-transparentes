/**
* Viajes transparentes rest API
*/
//Yes I'm lazy

var db = require('./models');

function listen(app){
	
	// Ciudades --------------------------------
	app.get('/ciudades', function(req,res){    
		sendAll(db.ciudades,res) 
	});
	app.post('/ciudades', restrictedAccess , function(req,res){
		upsert(
			db.ciudades,
			{ ciudad : req.body.ciudad },
			req.body,
			res
		);
	});

	// Viajes ----------------------------------
	app.get('/viajes', function(req,res){ sendAll(db.viajes,res) });

	// Instituciones ---------------------------
	app.get('/instituciones', function(req,res){ sendAll(db.instituciones,res) });

	// Servidores ------------------------------
	app.get('/servidores', function(req,res){ sendAll(db.servidores,res) });
}


// Utils :::
function sendAll(model,res){
	model.find({},{_id:false,__v:false},function(err,docs){
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
function restrictedAccess(req,res,next){
	console.log('Token:');
	console.log(req.query.accesstoken);

	db.users.find()


	next();
}

exports.listen = listen;