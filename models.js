var db = require('./dbconfig');

/**
* level: 'root' is intended to have authority over everything
* auth_institutions : a collection of which institutions this user can modify
* auth_users : a collection of which institutions this user can modify
*/
var User = new db.Schema({
	id : String,
	email : String,
	password : String,
	name : String,
	level : {type: String, enum: ['root','admin']},
	permissions: {
		auth_instituciones : [{ type: db.Schema.ObjectId, ref: 'Institucion'}],
		auth_servidores    : [{ type: db.Schema.ObjectId, ref: 'Servidor'}],
		auth_viajes        : [{ type: db.Schema.ObjectId, ref: 'Viaje'}],
		can_create_instituciones : { type: Boolean, default : false},
		can_create_servidores : { type: Boolean, default : false},
		can_create_viajes : { type: Boolean, default : false}
	},
	created : {type: Date, default : Date.now }
});

var Ciudad = new db.Schema({
	ciudad : { type: String, required: true},
	estado : { type: String, required: true},
	pais : { type: String, required: true},
});

var Institucion = new db.Schema({
	nombre : { type: String, required: true},
	descripcion : { type: String, required: true},
	sitio : { type: String, required: true}
});

var Servidor = new db.Schema({
	nombre : { type: String, required: true},
	//                                          !!!!!!!!!!!!!!!!!!!!!!!!!!! FIGURE THIS OUT!
	_institucion : { 
		type: db.Schema.ObjectId,
		ref: 'Institucion' 
	},
	email : { 
		type: String, 
		validate: /^$|^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/ 
	},
	puesto : String,//"Nombre del Puesto"
	cargo_superior : String,//"Nombre del Cargo Superior"
	departamento : String, //"Nombre del Cargo"
	clave_salarial : {type: String, enum: ['HB1','KA02','KA2','KB1','KB2','KB3','MB2','MC03','MC1','MC2','MC3','NA1','NB3','NC1','NC2','NC3','OB02','OB2','OC002','OC02','OC1','OC2','OC3','PA1','PA3','PC1','PC2','PC3']},
	unidad_administrativa : String //"Unidad Administrativa"
});

var Viaje = new db.Schema({
	_servidor : {
		type: db.Schema.ObjectId, 
		ref: 'Servidor'
	},
	_institucion_hospedaje : {
		type: db.Schema.ObjectId, 
		ref: 'Institucion'
	},
	_institucion_pasaje : {
		type: db.Schema.ObjectId, 
		ref: 'Institucion'
	},	

	_origen : {
		type: db.Schema.ObjectId,
		ref: 'Ciudad'
	},

	_destinos : [{ type: db.Schema.ObjectId, ref: 'Ciudad'}],
	
	motivo : { type: String, required: true },
	oficio : { type: String, required: true },
	consecutivo : { type: String, required: true },
	contribucion_ifai : String,
	acuerdo : String,
	resultado : String,
	observaciones : String,
	antecedente : String,
	url_comunicado : String,
	mec_origen : {type: String, enum: ['Invitación', 'Requerimiento de UR']},
	tipo_rep : {type: String, enum: ['Técnico', 'Alto Nivel']},
	tipo_viaje : {type: String, enum: ['Nacional', 'Internacional']},
	ur : String,
	institucion_generadora : String,
	//	grupo_jerarquico : {type: String, enum: ['HB1','KA02','KA2','KB1','KB2','KB3','MB2','MC03','MC1','MC2','MC3','NA1','NB3','NC1','NC2','NC3','OB02','OB2','OC002','OC02','OC1','OC2','OC3','PA1','PA3','PC1','PC2','PC3']},
	
	pasaje : {
		tipo : {type: String, enum: ['Aéreo', 'Terrestre', 'Marítimo']},
		vuelo_origen : String,
		linea_origen : String,
		vuelo_regreso : String,
		linea_regreso : String
	},

	comision : {
		inicio  : {type: Date, required : true},
		fin : {type: Date, required : true},
		tipo : { type: String, required: true },
	},

	evento : {
		inicio  : {type: Date, required : true},
		fin : {type: Date, required : true},
		nombre : String,
		actividades : String,
		tema : String,
		url : String
	},

	gastos : {
		moneda : {type: String, enum: ['MXN', 'USD']},
		viaticos : Number,
		comprobado : Number,
		sin_comprobar : Number,
		hospedaje : Number, //"costo hotel"
		tarifa_diaria: Number,
		pasaje : Number,
		viatico_devuelto : Number
	},

	hotel : {
		inicio : {type: Date, required : true},
		fin : {type: Date, required : true},
		nombre : String
	}

});

exports.instituciones = db.mongoose.model('Institucion',Institucion);
exports.servidores = db.mongoose.model('Servidor',Servidor);
exports.viajes = db.mongoose.model('Viaje',Viaje);
exports.ciudades = db.mongoose.model('Ciudad',Ciudad);
exports.users = db.mongoose.model('User',User);
exports.mongoose = db.mongoose;