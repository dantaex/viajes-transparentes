/*
	Viajes transparentes scheduled jobs
	Every task is executed daily

	http://stackoverflow.com/questions/13345664/using-heroku-scheduler-with-node-js
	
*/

var db = require('./models'),
	fc = require('./lib/flowcontrol');

//not really a job but an update
db.viajes.find({})
	.select('gastos')
	.exec(function(err,viajes){
		fc.taskMap(
			viajes,
			function(viaje,next){

				var viaticos_mx = (viaje.gastos.viaticos || 0) * viaje.gastos.tcat,
					pasaje_mx = (viaje.gastos.pasaje || 0) * viaje.gastos.tcat,
					hospedaje_mx = (viaje.gastos.hospedaje || 0) * viaje.gastos.tcat;

				viaje.gastos.total_mx = viaticos_mx + pasaje_mx + hospedaje_mx;
				viaje.save(function(err,doc){
					if(doc) next(null,true);
					else	next(true,null);
				});
			},
			function(err,todos){
				console.log('Modificados:');
				console.log(todos.length);
			});
	});


//EN QUE SE GASTA MAS?
/*
	Solo se cuentan los viajes que tienen
	viaticos
	pasaje
	hospedaje 

	viaticos,pasaje,hospedaje
	71618.78
	113167.07
	24059.64	
*/

db.meta.findOne({},function (err,metadoc) {
	if(metadoc){
		var viaticos = 0,
			hospedaje = 0,
			pasaje = 0;
		db.viajes.find({})
			.select('gastos')
			.exec(function(err,viajes){

				fc.taskMap(
					viajes,
					function(viaje,next){
						var viaticos_mx = (viaje.gastos.viaticos || 0) * viaje.gastos.tcat,
							pasaje_mx = (viaje.gastos.pasaje || 0) * viaje.gastos.tcat,
							hospedaje_mx = (viaje.gastos.hospedaje || 0) * viaje.gastos.tcat;

						viaticos += viaticos_mx;
						pasaje += pasaje_mx;
						hospedaje += hospedaje_mx;

						next(null,true);
					},
					function(err,docs){
						metadoc.total_viaticos = viaticos;
						metadoc.total_pasaje = pasaje;
						metadoc.total_hospedaje = hospedaje;
						metadoc.grand_total = hospedaje + viaticos + pasaje;
						metadoc.save();
						console.log('viaticos,pasaje,hospedaje');
						console.log(viaticos);
						console.log(pasaje);
						console.log(hospedaje);
					});
			});
	}
});

//AVERAGE TRIPS
db.meta.findOne({},function(err,doc){
	if(doc){

		fc.taskMap(
			[
				db.viajes.count(),
				db.servidores.count(),
			],
			function(query,next){
				query
				.exec(function(err,count){
					next(err,count);
				});
			}, 
			function(err,counts){
				doc.averageTrips = counts[0]/counts[1];
				doc.save();
			}
		);
	}
});


//TOTAL SPENT (take this to model hook) for each traveller
db.servidores.find({})
	.select('_viajes nombre')
	.populate('_viajes')
	.exec(function(err,servidores){
		fc.taskMap(
			servidores,
			function(servidor,next){
				var spent_so_far_mxn = 0;

				for (var i = servidor._viajes.length - 1; i >= 0; i--) {
					var viaticos = 0 || servidor._viajes[i].gastos.viaticos,  
						pasaje = 0 || servidor._viajes[i].gastos.pasaje,
						hospedaje = 0 || servidor._viajes[i].gastos.hospedaje; 
					
					var thisTripExp = (viaticos*1 + pasaje*1 + hospedaje*1) * servidor._viajes[i].gastos.tcat;
					spent_so_far_mxn += thisTripExp;
					// console.log('------ini------');
					// console.log(servidor.nombre);
					// console.log(viaticos);
					// console.log(hospedaje);
					// console.log(pasaje);
					// console.log(servidor._viajes[i].gastos.tcat);
					// console.log('total:');
					// console.log(thisTripExp);
					// console.log('------fin------');
				};
				servidor.spent_so_far_mxn = spent_so_far_mxn;
				servidor.save(function(err,saved){
					var a = saved != null;
					next(err,a);
				});
			},
			function(err,resultados){
				console.log(resultados.length+' servidores modificados ');
			});
	});