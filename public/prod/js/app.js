/**
* Viajes transparentes 
* Made by @dantaex
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
							return result.data.data;
						},
						function(){
							console.log('Could not load options');
						});
			},
			chartData : function(){
				return $http.get( '/chartdata' )
					.then(function(result) { 
							return result.data.data; 
						}, 
						function(){ 
							console.log('Could not load suggestions');
						});
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];


		/*
		*	This is the indexed collection of full Travel data
		*	So server requests ocurr only once per _id
		*/
		$scope.fullTravels = {};

		$scope.searchMode = 'servidores';
		$scope.activeSuggestion = 0;
		$scope.suggestionIndex = -1;

		/*
		*	Search options
		*/
		$scope.options = [];
		$scope.loading = '';

		/*
		*	Autocomplete suggestions
		*/		
		$scope.suggestions = [];
		$scope.allSuggestions = DataService.suggestions();
		$scope.allSuggestions.then(function(data){
			for (var i = data.length - 1; i >= 0; i--) {
				for (var j = data[i].length - 1; j >= 0; j--) {
					data[i][j].title = data[i][j].nombre || data[i][j].ciudad || data[i][j].evento.nombre;
					
					if(data[i][j].title == null)
						data[i].splice(j, 1);
					else {
						data[i][j].title = data[i][j].title.toLowerCase();
						data[i][j].id 	 = data[i][j]._id;
					}
				};
			};
			$scope.allSuggestions = {
				'servidores': data[0],
				'destinos'  : data[1],
				'eventos'   : data[2],
			};
		});

		/* graph data */
		$scope.chartData = DataService.chartData();
		$scope.chartData.then(function(data){ 
			var travelbymonth = [0,0,0,0,0,0,0,0,0,0,0,0];
			var ndata= [];
			for (var i = data.length - 1; i >= 0; i--) {
				ndata[i] = {
					id : data[i]._id,
					date : new Date(data[i].comision.inicio)
				};
				
				try{
					travelbymonth[ ndata[i].date.getMonth() ]++;
				} catch(e){
					console.log('invalid thing ',e);
				}
			}
			var chartdata ={
				labels : months,
				datasets: [{
					label: "Viajes",
					fillColor: "rgba(26,188,156,0.2)",
					strokeColor: "rgba(26,188,156,1)",
					pointColor: "rgba(26,188,156,1)",
					pointStrokeColor: "#fff",
					pointHighlightFill: "#fff",
					pointHighlightStroke: "rgba(26,188,156,1)",
					data: travelbymonth
				}]
			}
			displayChart("yearlongchart",chartdata);
		});		


		$scope.some=function(){
			alert('ooooo');
		};
		//Autocomplete ::: --------------------------------------------------

		//private bicth
		var lastKeyPress = Date.now();
		$scope.autocomplete = function(e){
			if( e.keyCode == 8 || e.keyCode == 46 || e.keyCode > 47 ){
				var call = Date.now();
				if(call-lastKeyPress > 200){

					var sugs = $scope.allSuggestions[$scope.searchMode];

					var filtered = [];

					var ll = sugs.length;
					for (var i = 0; i < 10 && i < ll; i++) {
						if( sugs[i].title.indexOf($scope.searchinput) != -1 )
							filtered.push(sugs[i]);
					}
					$scope.suggestions = filtered;
				}
				if(call-lastKeyPress > 700){
					$scope.updateOptions();
				}
				lastKeyPress = call;
			} else if (e.keyCode == 13 && $scope.suggestionIndex > -1 && $scope.suggestions.length > 0){
				//update model
				$scope.searchinput = $scope.suggestions[$scope.suggestionIndex].title;
				//and empty suggestions
				$scope.suggestions = [];
				//and update options
				$scope.updateOptions();
			}
		};
		/*
		* Up and down movement
		*
		*/
		$scope.moveUpOrDown = function(e){
			if( e.keyCode == 38 || e.keyCode == 40 ){
				var sug = $scope.suggestionIndex;
				var len = $scope.suggestions.length;

				if(len > 0){
					if(e.keyCode == 38) $scope.suggestionIndex = (--sug < 0)? len -1 : sug;
					else if(e.keyCode == 40) $scope.suggestionIndex = ++sug % (len);

					$scope.activeSuggestion = $scope.suggestions[$scope.suggestionIndex].id;
				}
			}
		};

		$scope.setSuggestion = function(id){
			$scope.activeSuggestion = id;
		};		

		//UX TRANSITIONS ::: --------------------------------------------------		

		$scope.welcome_panel_class = 'in';
		$scope.travel_panel_class  = 'out';
		$scope.search_panel_class  = 'out';
		$scope.chart_panel_class = 'out';

		$scope.navigateTo = function(panel,then){

			$scope.welcome_panel_class = 'out';
			$scope.travel_panel_class  = 'out';
			$scope.search_panel_class  = 'out';
			$scope.chart_panel_class = 'out';
			
			switch(panel){
				case 'welcome_panel': $scope.welcome_panel_class = 'in'; break;
				case 'search_panel' : $scope.search_panel_class = 'in'; break;
				case 'chart_panel': $scope.chart_panel_class = 'in'; break;
				case 'travel_panel' : $scope.travel_panel_class = 'in'; break;
			}
			if(typeof then == 'function') then();
			else if(then == 'backward')   $scope.history.back();
		};

		$scope.chartPanel = function(){
			$scope.navigateTo('chart_panel',function(){
				$scope.history.pushState({ status: 'chart_panel', travelData : {} },'Viajes Transparentes',$scope.domain+'graficas/');				
			});
		};

		$scope.searchPanel = function(){
			$scope.navigateTo('search_panel',function(){
				$scope.history.pushState({ status: 'search_panel', travelData : {} },'Viajes Transparentes',$scope.domain+'buscar/');
				/**
				* Bad practice? bullshit!
				* just take a look at this http://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field
				* this is the fastest and simplest way
				*/
				document.getElementById('search-input').focus();
			});
		};

		$scope.view = function(id){
			//if and only if this shit ins't here yet
			if( $scope.fullTravels[id] ){
				$scope.welcome_panel = 'out';
				$scope.currentTravel = travel;
				$scope.navigateTo('travel_panel',function(){
					$scope.history.pushState({ status: 'travel_panel', travelData : travel },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
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
							$scope.history.pushState({ status: 'travel_panel', travelData : travel },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
						});
					});
			}
		};

		$scope.subscribed = 'Suscribirme';
		$scope.subscribe = function(){
			if($scope.subscribed != 'listo'){
				$http.post('/subscriptions',{email:$scope.subscriptor})
					.then(function(response) {
							if(response.data.status == 'success'){
								$scope.subscribed = 'listo';
							} else{
								console.log(response);
							}
						},
						function(what){
							console.log('Error subscribing',what);
						});
			}
		};
		
		$scope.switchMode = function(mode){
			if(mode=='inicio')
				alert('Próximamente');
			else{
	 			$scope.searchMode=mode;
	 			$scope.searchinput='';
	 			$scope.suggestions=[];
	 			$scope.options = [];
	 			document.getElementById('search-input').focus();
			}
		};

		$scope.pdf = function(id){
			alert('Próximamente');
		};

		$scope.email = function(id){
			alert('Próximamente');
		};
		

		//HISTORY HANDLING ::: -----------------------------------------------

		$scope.history = history || window.history;

		switch(section){
			case 'chart_panel' :
				$scope.history.replaceState({status:'chart_panel',travelData:{}},null,document.URL);
				$scope.navigateTo('chart_panel');				
			break;			
			case 'welcome_panel' :
				$scope.history.replaceState({status:'welcome_panel',travelData:{}},null,document.URL);
				$scope.navigateTo('welcome_panel');
			break;
			case 'travel_panel' :
				if(initialData){
					initialData = format(initialData);
					$scope.history.pushState({ status: 'welcome_panel', travelData : {} },'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'travel_panel', travelData : initialData },'Viajes Transparentes',$scope.domain+'viajes/'+initialData._id);
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
			$scope.$apply(function(){
				$scope.navigateTo(event.state.status);
				$scope.currentTravel = event.state.travelData;
			});
		};

		$scope.updateOptions = function(submited){
			$scope.options = DataService.travel($scope.searchinput,$scope.searchMode);
			$scope.options.then(function(data){
				$scope.options = formatOptions(data);
				$scope.loading = '';
			});
			if(submited){
				hideMobileKeyboards();
			}
		}

		//UTILITIES ::: --------------------------------------------------

		function formatOptions(opts){
			for (var i = opts.length - 1; i >= 0; i--) {
				var date = new Date(opts[i].comision.inicio);
				opts[i].inicio = {
					dia : date.getDay(),
					mes : months[date.getMonth()],
					anio : date.getFullYear()
				};

				var viaticos  = opts[i].gastos.viaticos || 0,
					pasaje 	  = opts[i].gastos.pasaje || 0,
					hospedaje = opts[i].gastos.hospedaje || 0;
				opts[i].totalCost = _.str.numberFormat( viaticos + pasaje + hospedaje, 2 );

				var destinos = [];
				for(var j=opts[i]._destinos.length-1;j>=0;j--)
					destinos.push( opts[i]._destinos[j].ciudad );

				opts[i].destinos = destinos.join('; ');
				if(opts[i]._destinos[0].pais)
					opts[i].destinos += ', '+opts[i]._destinos[0].pais;

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

		//Tricks and aberrations ::: --------------------------------------------------

		function hideMobileKeyboards(){
			//verify size
			var w = window,
			    d = document,
			    e = d.documentElement,
			    g = d.getElementsByTagName('body')[0],
			    x = w.innerWidth || e.clientWidth || g.clientWidth,
			    y = w.innerHeight|| e.clientHeight|| g.clientHeight;			
			if(x < 500 && y< 500){
				var where = document.getElementById('here');
				var field = document.createElement('input');
				field.setAttribute('type', 'text');
				// document.body.appendChild(field);
				where.appendChild(field);

				setTimeout(function() {
				    field.focus();
				    setTimeout(function() {
				        field.setAttribute('style', 'display:none;');
				    }, 15);
				}, 15);
			}
		}

		function displayChart(dom_id,data){
			var context = document.getElementById(dom_id).getContext("2d");
			// var myNewChart = new Chart(context).Line(data, options);
			var myNewChart = new Chart(context).Line(data);
		}
	});
	
})(console);