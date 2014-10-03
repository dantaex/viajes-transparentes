/**
* Viajes transparentes 
* Made in 3 hours by @dantaex
*/
(function(cc){
	var app = angular.module('viajes',[]);

	app.factory('DataService', function($http, $q, $timeout){
		return {
			suggestions : function(){
				return $http.get( '/suggestions' )
					.then(function(result) { 
							return result.data.data; 
						}, 
						function(){ 
							console.log('Could not load suggestions');
						});				
			},
			travel : function(searchinput,searchMode){
				searchinput = searchinput || '';
				searchMode  = searchMode  || '';
				return $http.get( '/travel/?term='+searchinput+'&by='+searchMode+'&limit=4' )
					.then(function(result) { 
							console.log('!! server request');
							return result.data.data;
						}, 
						function(){ 
							console.log('Could not load options');
						});
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];

		/*
		*	This is the indexed collection of full Travel data
		*	So server requests ocurr only once per _id
		*/
		$scope.fullTravels = {};

		$scope.searchMode = 'servidores';
		$scope.activeSuggestion = 0;

		/*
		*	Search options
		*/
		// $scope.options = DataService.travel();
		// $scope.options.then(function(data){			
		// 	$scope.options = formatOptions(data);
		// });
		$scope.options = [];

		/*
		*	Autocomplete suggestions
		*/		
		$scope.suggestions = [];
		// $scope.allSuggestions = DataService.suggestions();
		// $scope.allSuggestions.then(function(data){			
		// 	$scope.allSuggestions = data;
		// });		
		//scaffolding
		$scope.allSuggestions = {
			servidores : [
				{id:'1', title: 'Lana del Rey'},
				{id:'2', title: 'Vladmir Putin'},
				{id:'3', title: 'Enrique Peña Nieto'},
				{id:'4', title: 'Whateva'},
				{id:'4', title: 'Lana Lang'},
				{id:'4', title: 'Laura M'},
				{id:'4', title: 'Ernesto Larrea'},
				{id:'5', title: 'Mariano Matamoros Lara'}
			],
			destinos : [
				{id:'1', title: 'Puebla'},
				{id:'2', title: 'México DF'},
				{id:'3', title: 'Tijuana'},
				{id:'4', title: 'Whateva'},
				{id:'5', title: 'Puente'},
				{id:'5', title: 'Pues'},
				{id:'5', title: 'Putla'}
			],
			eventos : [
				{id:'1', title: 'Reunion de trabajadores de'},
				{id:'2', title: 'Ministerio de magia'},
				{id:'3', title: 'Simposium de empresarios textileros'},
				{id:'4', title: 'Bienal de Transparencia'},
				{id:'5', title: 'Reunion de Amantes de Motocicletas'},
				{id:'5', title: 'Whateva'},
				{id:'5', title: 'Simp dasd dsa da ds'}
			],			
		};

		//Autocomplete ::: --------------------------------------------------

		//private bicth
		var lastKeyPress = Date.now();
		$scope.autocomplete = function(e){
			if( e.keyCode == 38 || e.keyCode == 40 ){
				var sug = $scope.activeSuggestion;
				var len = $scope.suggestions.length;
				//movement
				if(e.keyCode == 38){
					$scope.activeSuggestion = (--sug < 0)? len : sug;
				} else if(e.keyCode == 40){
					$scope.activeSuggestion = ++sug % (len+1);
				} 
			} else {
				var call = Date.now();
				if(call-lastKeyPress > 200){

					var sugs = $scope.allSuggestions[$scope.searchMode];

					var filtered = [];
					for (var i = sugs.length - 1; i >= 0; i--) {
						if( sugs[i].title.toLowerCase().indexOf($scope.searchinput) != -1 )
							filtered.push(sugs[i]);
					};
					$scope.suggestions = filtered;

					console.log('Filtered suggestions');
					console.log(filtered);

				}
				if(call-lastKeyPress > 700){
					
					console.log('options suposed to arrive now');

					$scope.options = DataService.travel($scope.searchinput,$scope.searchMode);
					$scope.options.then(function(data){
						$scope.options = formatOptions(data);
					});
				}
				lastKeyPress = call;
			}
		};
		// $scope.moveAlongList = function(e){
		// 	var sug = $scope.activeSuggestion;
		// 	var len = $scope.suggestions.length;
		// 	//movement
		// 	if(e.keyCode == 38){
		// 		$scope.activeSuggestion = (--sug < 0)? len : sug;
		// 	} else if(e.keyCode == 40){
		// 		$scope.activeSuggestion = ++sug % (len+1);
		// 	} 
		// };
		$scope.setSuggestion = function(id){
			$scope.activeSuggestion = id;
		};		

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
		
		//UTILITIES ::: --------------------------------------------------

		function formatOptions(opts){
			// origen - destino
			for (var i = opts.length - 1; i >= 0; i--) {
				var date = new Date(opts[i].comision.inicio);
				opts[i].inicio = {
					dia : date.getDay(),
					mes : date.getMonth(),
					anio : date.getYear()
				};

				var viaticos  = opts[i].gastos.viaticos || 0,
					pasaje 	  = opts[i].gastos.pasaje || 0,
					hospedaje = opts[i].gastos.hospedaje || 0;
				opts[i].totalCost = _.str.numberFormat( viaticos + pasaje + hospedaje, 2 );

				var destinos = [];
				for(var j=opts[i]._destinos.length-1;j>=0;j--)
					destinos.push( opts[i]._destinos[j].ciudad+','+opts[i]._destinos[j].pais );

				opts[i].destinos = destinos.join('; ');
				opts[i].origen = opts[i]._origen.ciudad+','+opts[i]._origen.pais;

				switch(opts[i].pasaje.tipo){
					case 'Aéreo': opts[i].transportClass = 'ar-transport-air'; break;
					case 'Terrestre': opts[i].transportClass = 'ar-transport-land'; break;
					case 'Marítimo': opts[i].transportClass = 'ar-transport-sea'; break;
					default : opts[i].transportClass = 'ar-transport-unk'; break;
				}				
			};
			return opts;
		}

		function format(travel){

			switch(travel.pasaje.tipo){
				case 'Aéreo': travel.transportClass = 'ar-transport-air'; break;
				case 'Terrestre': travel.transportClass = 'ar-transport-land'; break;
				case 'Marítimo': travel.transportClass = 'ar-transport-sea'; break;
				default : travel.transportClass = 'ar-transport-unk'; break;
			}

			var viaticos  = travel.gastos.viaticos || 0,
				pasaje 	  = travel.gastos.pasaje || 0,
				hospedaje = travel.gastos.hospedaje || 0;
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