/**
* Viajes transparentes 
* Made in 3 hours by @dantaex
*/
(function(cc){
	var app = angular.module('viajes',[]);

	app.factory('DataService', function($http, $q, $timeout){
		return {
			viajes : function() {
				return $http.get( '/viajes' ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			},
			instituciones : function(){
				return $http.get( '/instituciones' ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			},
			autocomplete : function(searchinput,searchMode){
				return $http.get( '/search/?term='+searchinput+'&by='+searchMode ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		$scope.currentURL = document.URL;
		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];

		$scope.fullTravels = {};
		$scope.travels = DataService.viajes();
		$scope.travels.then(function(data){
			$scope.travels = data;
		});
		$scope.institutions = DataService.instituciones().then(function(data){
			$scope.institutions = idsAsIndexes(data);
		});
		

		//History dude
		$scope.history = history || window.history;
		if(initialData){
			initialData = format(initialData);
			$scope.history.pushState({ status: 'welcome', travelData : {} },'Viajes Transparentes',$scope.domain);
			$scope.history.pushState({ status: 'travel', travelData : initialData },'Viajes Transparentes',document.URL+initialData._id);
			$scope.currentTravel = initialData;
			$scope.welcome_panel = 'out';
		} else{
			$scope.history.replaceState({status:'welcome',travelData:{}},null,document.URL);
			$scope.welcome_panel = 'in';
			$scope.currentTravel = null;
		}	
		window.onpopstate = function(event){
			switch(event.state.status){
				case 'welcome':
					$scope.$apply(function () {
						$scope.currentTravel = null;
						$scope.welcome_panel = 'in';
						$scope.currentURL = document.URL;
					});
				break;
				case 'travel':
					$scope.$apply(function () {
						$scope.currentTravel = event.state.travelData;
						$scope.welcome_panel = 'out';
						$scope.currentURL = document.URL;
					});
				break;
			}
		};


		$scope.view = function(id){
			//if and only if this shit ins't here yet
			if( $scope.fullTravels[id] ){
				$scope.welcome_panel = 'out';
				$scope.history.pushState({ status: 'travel', travelData : travel },'Viajes Transparentes',document.URL+travel._id);
				$scope.currentTravel = travel;				
			} else {
				cc.log('server request');
				$http.get("/viajes/"+id)
					.error(function(data, status, headers, config) {})
					.success(function(data, status, headers, config) {
						travel = format(data.data);
						$scope.fullTravels[travel._id] = travel;
						$scope.welcome_panel = 'out';
						$scope.history.pushState({ status: 'travel', travelData : travel },'Viajes Transparentes',document.URL+travel._id);
						$scope.currentTravel = travel;
						$scope.currentURL = document.URL;
					});
			}
		};
		$scope.cancelView = function(){
			$scope.currentTravel = null;
			$scope.welcome_panel='in';
			$scope.history.back();
		};

		$scope.hideIfAlmost = function(){
			if($scope.welcome_panel=='almost')
				$scope.welcome_panel = 'out';
		};

		$scope.pdf = function(id){
			alert('Próximamente');
		};

		$scope.email = function(id){
			alert('Próximamente');
		};
		
		//scaffold
		$scope.suggestions = [
			{id:'1', title: 'Lana del Rey'},
			{id:'2', title: 'Vladmir Putin'},
			{id:'3', title: 'Enrique Peña Nieto'},
			{id:'4', title: 'Whateva'},
			{id:'5', title: 'Mariano Matamoros Lara'}
		];
		$scope.searchMode = 'servidores';
		$scope.options = [
			{_id:'12313256465', transportClass: 'ar-transport-air', totalCost: '14,752.00', gastos: {moneda:'MXN'}, pasaje : {linea_origen:'Aeroméxico'}, _servidor : {_id : '54654654', tipo_rep:'Técnica', nombre: 'Lana Del Rey'}, inicio : {dia:'23',mes:'Abril',anio: '2013'} },
			{_id:'12313256465', transportClass: 'ar-transport-land', totalCost: '14,752.00', gastos: {moneda:'MXN'}, pasaje : {linea_origen:'Aeroméxico'}, _servidor : {_id : '54654654', tipo_rep:'Técnica', nombre: 'Lana Del Rey'}, inicio : {dia:'23',mes:'Abril',anio: '2013'} },
			{_id:'12313256465', transportClass: 'ar-transport-sea', totalCost: '14,752.00', gastos: {moneda:'MXN'}, pasaje : {linea_origen:'Aeroméxico'}, _servidor : {_id : '54654654', tipo_rep:'Técnica', nombre: 'Lana Del Rey'}, inicio : {dia:'23',mes:'Abril',anio: '2013'} },
			{_id:'12313256465', transportClass: 'ar-transport-unk', totalCost: '14,752.00', gastos: {moneda:'MXN'}, pasaje : {linea_origen:'Aeroméxico'}, _servidor : {_id : '54654654', tipo_rep:'Técnica', nombre: 'Lana Del Rey'}, inicio : {dia:'23',mes:'Abril',anio: '2013'} }
		];

		$scope.activeSuggestion = 0;

		//private bicth
		var lastAutocompCall = Date.now();
		$scope.autocomplete = function(e){
			var call = Date.now();			
			if(call-lastAutocompCall > 300){

				$scope.searchinput 
			}
			lastAutocompCall = call;
		};
		$scope.moveAlongList = function(e){
			var sug = $scope.activeSuggestion;
			var len = $scope.suggestions.length;
			//movement
			if(e.keyCode == 38){
				$scope.activeSuggestion = (--sug < 0)? len : sug;
			} else if(e.keyCode == 40){
				$scope.activeSuggestion = ++sug % (len+1);
			} 
		};
		$scope.setSuggestion = function(id){
			$scope.activeSuggestion = id;
		};

		//utils

		//side effects FTW
		function format(travel){

			switch(travel.pasaje.tipo){
				case 'Aéreo': travel.transportClass = 'ar-transport-air'; break;
				case 'Terrestre': travel.transportClass = 'ar-transport-land'; break;
				case 'Marítimo': travel.transportClass = 'ar-transport-sea'; break;
				default : travel.transportClass = 'ar-transport-unk'; break;
			}

			var viaticos = (travel.gastos.viaticos)? travel.gastos.viaticos : 0,
				pasaje = (travel.gastos.pasaje)? travel.gastos.pasaje : 0,
				hospedaje = (travel.gastos.hospedaje)? travel.gastos.hospedaje : 0;
			travel.totalCost = _.str.numberFormat(  viaticos + pasaje + hospedaje, 2 );

			var destinos = [];
			for(var i=travel._destinos.length-1;i>=0;i--)
				destinos.push( travel._destinos[i].ciudad+','+travel._destinos[i].pais );
			travel.destinos = destinos.join('; ');
			travel.origen = travel._origen.ciudad+','+travel._origen.pais;

			travel.dias = Math.round(Math.abs(( (new Date(travel.comision.fin)) - (new Date(travel.comision.inicio)) )/(24*60*60*1000))) + "";
			travel.dias = (travel.dias == 'NaN')? '' : (travel.dias=='0' || travel.dias=='1')? '1 día' : travel.dias +'días' ;

			var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

			travel.comision.inicio = new Date(travel.comision.inicio);
			travel.comision.fin = new Date(travel.comision.fin);
			
			travel.inicio = { dia: travel.comision.inicio.getDay(), mes : months[travel.comision.inicio.getMonth()], anio : travel.comision.inicio.getFullYear() };
			travel.fin = { dia: travel.comision.fin.getDay(), mes : months[travel.comision.fin.getMonth()], anio : travel.comision.fin.getFullYear() };

			var m = travel.motivo.charAt(0).toUpperCase();
			travel.motivo = m + travel.motivo.toLowerCase().substr(1);

			 return travel;
		}

		function idsAsIndexes(objects){
			var dictionary = {};
			for (var i = objects.length - 1; i >= 0; i--) {
				dictionary[objects[i]._id] = objects[i];
			};
			return dictionary;
		}

	});
	
})(console);