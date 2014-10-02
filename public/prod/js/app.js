/**
* Viajes transparentes 
* Made in 3 hours by @dantaex
*/
(function(cc){
	var app = angular.module('viajes',[]);

	app.factory('DataService', function($http, $q, $timeout){
		return {
			viajes : function() {
				return $http.get( '/travel' ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			},
			institutions : function(){
				return $http.get( '/institutions' ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			},
			autocomplete : function(searchinput,searchMode){
				return $http.get( '/search/?term='+searchinput+'&by='+searchMode ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];

		$scope.fullTravels = {};
		$scope.travels = DataService.viajes();
		$scope.travels.then(function(data){
			$scope.travels = data;
		});
		$scope.institutions = DataService.institutions().then(function(data){
			$scope.institutions = idsAsIndexes(data);
		});

		//UX TRANSITIONS ::: --------------------------------------------------			
		$scope.welcome_panel_class = 'in';
		$scope.travel_panel_class  = 'out';
		$scope.search_panel_class  = 'out';
		$scope.explore_panel_class = 'out';

		$scope.navigateTo = function(panel,then){

			$scope.welcome_panel_class = 'out';
			$scope.travel_panel_class  = 'out';
			$scope.search_panel_class  = 'out';
			$scope.explore_panel_class = 'out';
			
			switch(panel){
				case 'welcome_panel': $scope.welcome_panel_class = 'in'; break;
				case 'search_panel' : $scope.search_panel_class = 'in'; break;
				case 'explore_panel': $scope.explore_panel_class = 'in'; break;
				case 'travel_panel' : $scope.travel_panel_class = 'in'; break;
			}
			if(typeof then == 'function') then();
			else if(then == 'backward')   $scope.history.back();
		};

		$scope.searchPanel = function(){
			$scope.navigateTo('search_panel',function(){
				$scope.history.pushState({ status: 'search_panel', travelData : {} },'Viajes Transparentes',$scope.domain+'buscar/');
			});
		};

		$scope.view = function(id){
			//if and only if this shit ins't here yet
			if( $scope.fullTravels[id] ){
				$scope.welcome_panel = 'out';
				$scope.currentTravel = travel;
				$scope.navigateTo('travel_panel',function(){
					$scope.history.pushState({ status: 'travel_panel', travelData : travel },'Viajes Transparentes',$scope.domain+travel._id);
				});
			} else {
				cc.log('server request');
				$http.get("/travel/"+id)
					.error(function(data, status, headers, config) {})
					.success(function(data, status, headers, config) {
						travel = format(data.data);
						$scope.fullTravels[travel._id] = travel;
						$scope.currentTravel = travel;
						$scope.navigateTo('travel_panel',function(){
							$scope.history.pushState({ status: 'travel_panel', travelData : travel },'Viajes Transparentes',$scope.domain+travel._id);
						});
					});
			}
		};

		$scope.peep = function(panel){
			switch(panel){
				case 'welcome_panel' :
					$scope.welcome_panel_class = 'almost';
				break;
				// case 'search_panel' :
				
				// break;
				// case 'explore_panel' :
				
				// break;
				case 'travel_panel' :
					$scope.welcome_panel_class = 'out';
				break;
			}
		};


		//HISTORY HANDLING ::: -----------------------------------------------

		$scope.history = history || window.history;

		switch(section){
			case 'welcome_panel' :
				$scope.history.replaceState({status:'welcome_panel',travelData:{}},null,document.URL);
				$scope.navigateTo('welcome_panel');
			break;
			case 'travel_panel' :
				if(initialData){
					initialData = format(initialData);
					$scope.history.pushState({ status: 'welcome_panel', travelData : {} },'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'travel_panel', travelData : initialData },'Viajes Transparentes',$scope.domain+initialData._id);
					$scope.currentTravel = initialData;
					$scope.navigateTo('travel_panel');
				}
			break;
			case 'search_panel' :
				$scope.history.pushState({ status: 'welcome_panel', travelData : {} },'Viajes Transparentes',$scope.domain);
				$scope.history.pushState({ status: 'search_panel',  travelData : {} },'Viajes Transparentes',$scope.domain+'buscar/');
				$scope.navigateTo('search_panel');
			break;
		}

		window.onpopstate = function(event){
			console.log(event.state.status);

			$scope.$apply(function(){
				$scope.navigateTo(event.state.status);
				$scope.currentTravel = event.state.travelData;
			});
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

		//UTILITIES ::: --------------------------------------------------

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