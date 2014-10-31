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
					.then(function(response) { 
							return response.data.data; 
						}, 
						function(){ 
							console.log('Could not load suggestions');
							return [];
						});
			},
			questions : function(travelID){
				return $http.get( '/travel/'+travelID+'/questions' )
					.then(function(response){
							return response.data.data;
						}, 
						function(){ 
							console.log('Could not load questions');
							return [];
						});
			},
			travel : function(searchinput,searchMode){
				searchinput = searchinput || '';
				searchMode  = searchMode  || '';
				return $http.get( '/travel/?term='+searchinput+'&by='+searchMode+'&limit=4' )
					.then(function(response) { 
							return response.data.data;
						},
						function(){
							console.log('Could not load options');
							return [];
						});
			},
			chartData : function(){
				return $http.get( '/chartdata' )
					.then(function(response) { 
							return response.data.data; 
						}, 
						function(){ 
							console.log('Could not load charts');
							return [];
						});
			},
			travellers : function(searchinput){
				searchinput = searchinput || '';
				return $http.get( '/travellers/?term='+searchinput+'&limit=4' )
					.then(function(response) { 
							return response.data.data;
						},
						function(){
							console.log('Could not load travellers');
							return [];
						});
			},
			traveller : function(id){
				return $http.get( '/travellers/'+id )
					.then(function(response){
							return response.data.data;
						}, 
						function(){ 
							console.log('Could not load traveller');
							return [];
						});								
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		var cMonth = (new Date()).getMonth();
		var months_upto_now = monthsUptoNow().months;
		var numberMonths = monthsUptoNow().numbers;


		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];
		$scope.alert = false;

		/*
		*	This is the indexed collection of full Travel data
		*	So server requests ocurr only once per _id
		*/
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
		$scope.institutions = {'542700d8df6fec2c037d773b':{nombre:'IFAI'},'54290faaab084897f2cbae5b':{nombre:'IACIP'},'54291046ab084897f2cbae5c':{nombre:'ECOM-LAC'}};

		//USER LOGIN [Facebook & email] (Ask questions, follow burocrats, subscribe)  ::: --------------------------------------------		

		$scope.loginModal = 'out';
		$scope.loggedUser = {
			logged: false, 
			userData : {
				email : null,
				name : 'Invitado',
				profpic :  '/img/user2.svg',
				channel: null,
				channelData : null
			}
		};
		$scope.loginModalCallback = function(){ };
		$scope.questionSubmitAttempt = function(input,travelID,travellerID){
			
			$scope.nq.disabled = true;
			$scope.alert = 'Enviando pregunta...';

			if($scope.loggedUser.logged){
				//If user data is already on the browser... (i.e. makes second question)
				$scope.submitQuestion({
					text : input,
					from : $scope.loggedUser.userData,
					to : travellerID,
					about: travelID
				});
			} else {
				if(FBSTATUS == 'connected'){
					//logged into FB & App, just send question
					console.log('CONNECTED! so getting email & shit');
					$scope.updateUserDataFromFacebook(function(loggedUserData){
						$scope.submitQuestion({
							text : input,
							from : loggedUserData,
							to : travellerID,
							about: travelID
						});
					});
				} else if(FBSTATUS == 'not_authorized'){
					//logged into FB but not App, display facebook permissions window
					console.log('NOT_AUTHORIZED! so displaying FB permissions window');
					FB.login(function(response) {
						if (response.status === 'connected') {

							$scope.updateUserDataFromFacebook(function(loggedUserData){
								$scope.submitQuestion({
									text : input,
									from : loggedUserData,
									to : travellerID,
									about: travelID
								});
							});
						}
						//if user closes window nothing should happen
					 }, {scope: 'public_profile,email'});

				} else {
					//not logged into fb, displaying my modal
					$scope.loginModal = 'in';
					$scope.loginModalCallback = function(option){
						$scope.loginModal = 'out';
						switch(option){
							case 'facebook':
								FB.login(function(response) {
									if (response.status === 'connected') {
										$scope.updateUserDataFromFacebook(function(loggedUserData){
											$scope.submitQuestion({
												text : input,
												from : loggedUserData,
												to : travellerID,
												about: travelID
											});
										});
									}
								 }, {scope: 'public_profile,email'});
							break;
							default:
								$scope.alert = false;
								$scope.nq.disabled = false;									
							break;
						}
					};					
				}
			}

		};

		$scope.updateUserDataFromFacebook = function(callback){
			FB.api('/me',function(response){
				console.log('Facebook /me data arrived:');
				console.log(response);

				var newLoggedUserData = {
					logged : true,
					userData : {
						email : response.email,
						name : response.name,
						profpic :  'http://graph.facebook.com/v2.1/'+response.id+'/picture',
						channel: 'facebook',
						channelData : {
							facebookID : response.id,
							facebookLink : response.link,
							gender : response.gender
						}
					}
				};
				$scope.$apply(function(){
					$scope.loggedUser = newLoggedUserData;
				});
				callback(newLoggedUserData.userData);
			});
		};

		/**
		* @param qdata An object with question and user information:
		*	{
		*		text : 'Why is Iggy Azalea obsessed with loboutines ?',
		*		from:{
		*			email: 'someguy@somedomain.com',
		*			name: 'Some guy',
		*			profpic: 'fbcdn.com/123456789098765432345678.png'|null
		*			channel: 'facebook'|'google'|'email'
		*			channelData: whatever data vendor provides (facebook userID, etc)
		*		}
		*	}
		*/
		$scope.nq = {disabled:false};
		$scope.submitQuestion = function(qdata){
			$http.post('/questions',qdata)
				.then(function(res){
					if(res.data.status=='success'){

						//ad question to UI
						for (var i = $scope.fullTravellers[ qdata.to ]._viajes.length - 1; i >= 0; i--) {
							if( $scope.fullTravellers[ qdata.to ]._viajes[i]._id == qdata.about)
								if($scope.fullTravellers[ qdata.to ]._viajes[i].questions)
									$scope.fullTravellers[ qdata.to ]._viajes[i].questions.push(qdata);
								else
									$scope.fullTravellers[ qdata.to ]._viajes[i].questions = [qdata];
						};
						
						//clean preview
						$scope.nq.input = '';
						$scope.alert = 'Pregunta enviada';
						setTimeout(function(){
							$scope.$apply(function(){
								$scope.alert = false;
							});
						},1500);
					}
					else{
						$scope.alert = 'UPS un problema ocurrió la pregunta no fue enviada!';
					}
					$scope.nq.disabled = false;					
				});
		};

		$scope.facebookLogin = function(){
			FB.login(statusChangeCallback, {scope: 'public_profile,email'});
		};

		var d = new Date();
		$scope.today = '' + d.getDay() + months[d.getMonth()] + d.getFullYear();


		//SEARCH & AUTOCOMPLETION ::: --------------------------------------------		
		$scope.travelOptions = [];
		$scope.travellerOptions = [];
		$scope.loading = '';
		$scope.models = [{name:'viajes'},{name:'personas'}];
		$scope.searchWhat = $scope.models[0];
		$scope.searchMode = 'servidores';
		$scope.activeSuggestion = 0;
		$scope.suggestionIndex = -1;

		$scope.suggestions = [];
		$scope.cities = [];
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
			$scope.cities = idsAsIndexes( data[1] );
		});

		$scope.resetSearch = function(e){
			if($scope.searchWhat.name == 'personas')
				$scope.searchMode = 'servidores';
			$scope.travelOptions=[];
			$scope.servidorOptions=[];
			$scope.suggestions=[];
			$scope.searchinput = '';
			searchInputFocus();
		};

		var lastKeyPress = Date.now();
		$scope.autocomplete = function(e){
			//select suggestion
			if (e.keyCode == 13 && $scope.suggestionIndex > -1 && $scope.suggestions.length > 0){

				$scope.submissionInProgress = false;
				//update model
				$scope.searchinput = $scope.suggestions[$scope.suggestionIndex].title;
				//and empty suggestions
				$scope.suggestions = [];
				//and update options
				$scope.updateOptions();

			//http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
			} else if( e.keyCode == 8 || e.keyCode == 46 || (e.keyCode > 47 && e.keyCode < 91) ){
				var call = Date.now();
				//suggest
				if(call-lastKeyPress > 200){

					var sugs = $scope.allSuggestions[$scope.searchMode];
					var filtered = [];
					var ll = sugs.length;

					for (var i = 0; i < ll; i++) {
						if( sugs[i].title.indexOf($scope.searchinput) != -1 )
							filtered.push(sugs[i]);
					}

					filtered = filtered.slice(0,10);

					if(filtered[0]){
						$scope.suggestionIndex = 0;
						$scope.activeSuggestion = filtered[0].id;
					}

					$scope.suggestions = filtered;
					$scope.list_out = 'ar-in';
				}
				//options
				if(call-lastKeyPress > 850){
					$scope.updateOptions();
				}
				lastKeyPress = call;
			} 

		};
		$scope.moveUpOrDown = function(e){
			if( e.keyCode == 38 || e.keyCode == 40 ){
				var sug = $scope.suggestionIndex;
				var len = $scope.suggestions.length;

				if(len > 0){
					if(e.keyCode == 38) $scope.suggestionIndex = (--sug < 0)? len -1 : sug;
					else if(e.keyCode == 40) $scope.suggestionIndex = ++sug % (len);

					if($scope.suggestions[$scope.suggestionIndex])
						$scope.setSuggestion($scope.suggestions[$scope.suggestionIndex].id);
				}
			}
		};
		$scope.setSuggestion = function(id){
			$scope.activeSuggestion = id;
		};
		$scope.suggestionsOut = function(){
			setTimeout(function(){
				$scope.$apply(function(){
					$scope.list_out = 'ar-out';
				});
			},100);
		};
		//form submission only
		$scope.submissionInProgress = false;
		$scope.submitSuggestion = function(){
			$scope.submissionInProgress = true;
			setTimeout(function(){ 
				if($scope.submissionInProgress){
					$scope.updateOptions('yes');
				}
			},100);
		};
		$scope.chooseSuggestion = function(sug){
			$scope.setSuggestion(sug.id);
			//update model
			$scope.searchinput = sug.title;
			//and empty suggestions
			$scope.suggestions = [];
			//and update options
			$scope.updateOptions();

			$scope.list_out = 'ar-out';
		};
		$scope.updateOptions = function(submited){
			if( $scope.searchWhat.name == 'viajes' ){
				$scope.travelOptions = DataService.travel($scope.searchinput,$scope.searchMode);
				$scope.travelOptions.then(function(data){
					$scope.travelOptions = formatOptions(data);
				});
				if(submited){
					$scope.$apply(function(){
						hideMobileKeyboards();
					});
				}				
			} else {
				$scope.travellerOptions = DataService.travellers($scope.searchinput);
				$scope.travellerOptions.then(function(data){
					$scope.travellerOptions = formatTravellerOptions(data);
				});
			}
		}

		//SUBSCRIPTIONS ::: --------------------------------------------------		
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

		//UX TRANSITIONS ::: --------------------------------------------------		

		$scope.currentPanel = 'welcome_panel';

		$scope.welcome_panel_class = 'in';
		$scope.travel_panel_class  = 'out';
		$scope.traveller_panel_class  = 'out';
		$scope.search_panel_class  = 'out';
		$scope.chart_panel_class = 'out';

		$scope.navigateTo = function(panel,then){
			$scope.currentPanel = panel;
			$scope.welcome_panel_class = 'out';
			$scope.travel_panel_class  = 'out';
			$scope.search_panel_class  = 'out';
			$scope.chart_panel_class   = 'out';
			$scope.traveller_panel_class = 'out';

			switch(panel){
				case 'welcome_panel': $scope.welcome_panel_class = 'in'; break;
				case 'search_panel' : $scope.search_panel_class = 'in'; break;
				case 'chart_panel': $scope.chart_panel_class = 'in'; break;
				case 'travel_panel' : $scope.travel_panel_class = 'in'; break;
				case 'traveller_panel' : $scope.traveller_panel_class = 'in'; break;
			}
			if(typeof then == 'function') then();
			else if(then == 'backward')   $scope.history.back();
		};

		$scope.welcomePanel = function(){
			$scope.navigateTo('welcome_panel',function(){
				$scope.history.pushState({ status: 'welcome_panel' },'Viajes Transparentes',$scope.domain);
			});
		};

		$scope.chartPanel = function(){
			$scope.navigateTo('chart_panel',function(){
				$scope.history.pushState({ status: 'chart_panel' },'Viajes Transparentes',$scope.domain+'graficas/');				
			});
		};

		$scope.searchPanel = function(){
			$scope.navigateTo('search_panel',function(){
				$scope.history.pushState({ status: 'search_panel' },'Viajes Transparentes',$scope.domain+'buscar/');
				searchInputFocus();
			});
		};

		$scope.fullTravels = {};
		$scope.travelPanel = function(id){
			//if and only if this shit ins't here yet
			if( $scope.fullTravels[id] ){
				var travel = $scope.fullTravels[id];
				$scope.currentTravel = travel;
				$scope.navigateTo('travel_panel',function(){
					$scope.history.pushState({ status: 'travel_panel', travelid : travel._id },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
					displayTravelCosts(travel);
				});
			} else {
				cc.log('app::server request:travel');
				$http.get("/travel/"+id)
					.error(function(data, status, headers, config){})
					.success(function(data, status, headers, config) {
						travel = format(data.data);
						$scope.fullTravels[travel._id] = travel;
						$scope.currentTravel = travel;
						$scope.navigateTo('travel_panel',function(){
							$scope.history.pushState({ status: 'travel_panel', travelid : travel._id },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
							displayTravelCosts(travel);
						});
					});
			}
		};

		$scope.fullTravellers = {};
		$scope.travellerPanel = function(id){
			if( $scope.fullTravellers[id] ){
				var traveller = $scope.fullTravellers[id];
				$scope.currentTraveller = traveller;
				displayTravellerCharts(traveller);
				$scope.navigateTo('traveller_panel',function(){
					$scope.history.pushState({ status: 'traveller_panel', travellerid : traveller._id },'Viajes Transparentes',$scope.domain+'servidores/'+traveller._id);
				});				
			} else {
				cc.log('app::server request::traveller');
				$scope.currentTraveller = DataService.traveller(id);
				$scope.currentTraveller.then(function(data){
					var traveller = formatTravellers(data);
					$scope.currentTraveller = traveller;
					$scope.fullTravellers[traveller._id] = traveller;
					getQuestionsForEveryTravelFrom($scope.fullTravellers[traveller._id]);
					displayTravellerCharts(traveller);
					$scope.navigateTo('traveller_panel',function(){
						JSON.stringify(traveller);
						$scope.history.pushState({ status: 'traveller_panel', travellerid : traveller._id },'Viajes Transparentes',$scope.domain+'servidores/'+traveller._id);
					});
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
	 			$scope.travelOptions = [];
	 			document.getElementById('search-input').focus();
			}
		};

		$scope.search_list_type = 'list';
		$scope.compareList = {
			size : 0,
			list : {},
			add : function(item){
				if(! this.list[item._id] ){
					this.list[item._id] = item;
					this.size++;
				}
				console.log(this.list);
			},
			remove : function(id){
				if( this.list[id] ){
					this.list[id] = null;
					this.size--;	
				}
			},
			clear : function(){
				this.list = {};
			}
		};

		$scope.pdf = function(id){
			alert('Próximamente');
		};

		$scope.email = function(id){
			alert('Próximamente');
		};
		

	
		//UTILITIES ::: --------------------------------------------------

		function getQuestionsForEveryTravelFrom(traveller){
			for (var i = traveller._viajes.length - 1; i >= 0; i--) {
				var ctravel = traveller._viajes[i];
				ctravel.questions = DataService.questions(ctravel._id);
				ctravel.questions.then(function(data){
					for (var j = data.length - 1; j >= 0; j--) {
						var cd = new Date(data[j].created);
						data[j].on = '' + cd.getDay() + months[cd.getMonth()] + cd.getFullYear();
					};
					ctravel.questions = data;
				});
			};
		}

		function formatTravellerOptions(opts){
			for (var i = opts.length - 1; i >= 0; i--) {
				opts[i].nombre = opts[i].nombre.toLowerCase();
				opts[i].puesto = opts[i].puesto.toLowerCase();
				opts[i].nviajes = (opts[i]._viajes.length==1)? '1 viaje' : opts[i]._viajes.length + ' viajes' ;
			};
			return opts;
		}

		function formatTravellers(traveller){
			traveller.totalSpent = 0.00;
			for (var i = traveller._viajes.length - 1; i >= 0; i--) {
				traveller._viajes[i] = format( traveller._viajes[i] );
				traveller._viajes[i].destino = '';

				console.log("Viaje:");
				console.log(traveller._viajes[i]);

				var comma = ',';
				for (var j = traveller._viajes[i]._destinos.length - 1; j >= 0; j--) {
					comma = (j==0)? '' : ', ';
					traveller._viajes[i].destino += traveller._viajes[i]._destinos[j].ciudad + comma;
				};

				traveller.totalSpent += traveller._viajes[i]._totalCost * traveller._viajes[i].gastos.tcat;
			}
			traveller.totalSpent = _.str.numberFormat(traveller.totalSpent,2);
			return traveller;
		}

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

			travel._totalCost = viaticos + pasaje + hospedaje;
			travel.totalCost = _.str.numberFormat(  viaticos + pasaje + hospedaje, 2 );

			travel.gastos._viaticos = _.str.numberFormat( viaticos, 2);
			travel.gastos._pasaje = _.str.numberFormat( pasaje, 2);
			travel.gastos._hospedaje = _.str.numberFormat( hospedaje, 2);

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

		function displayChart(dom_id,data){
			var context = document.getElementById(dom_id).getContext("2d");
			return new Chart(context).Line(data,{scaleShowGridLines:false});
		}		

		function displayTravellerCharts(traveller){
			var tripsLastYear = [0,0,0,0,0,0,0,0,0,0,0,0];
			var trips = traveller._viajes;

			//how many trips this guy had
			//var nmonthsFromLastYear = 12 - cMonth;
			for (var i = 0; i < 12; i++) {
				for (var j = 0; j < trips.length; j++) {

					// if(nmonthsFromLastYear > 0){
						if(  (new Date(trips[j].comision.inicio)).getMonth ==  numberMonths[i] )
							tripsLastYear[i]++;
					// } else{
					// 	if(  (new Date(trips[j].comision.inicio)).getMonth ==  numberMonths[i] )
					// 	tripsLastYear.push()
					// }
				}
				//nmonthsFromLastYear--;
			}

			console.log('months_upto_now');
			console.log(months_upto_now);

			console.log('tripsLastYear');
			console.log(tripsLastYear);

			var data = {
				labels : months_upto_now,
				datasets : [
					{
						// fillColor: "rgba(220,220,220,0.2)",
						// strokeColor: "rgba(220,220,220,1)",
						// pointColor: "rgba(220,220,220,1)",
						// pointStrokeColor: "#fff",
						// pointHighlightFill: "#fff",
						// pointHighlightStroke: "rgba(220,220,220,1)",
						data: tripsLastYear
					}
				]
			};

			//timeline
			displayChart('travellerTimeline',data);

			//sus gastos vs promedio

		}


		function monthsUptoNow(){
			var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
			var now = new Date();
			var nnmonths = [];
			var nnumbers = [];
			for (var i = 0, j = now.getMonth(); i < 12; i++  ) {
				nnmonths.push( months[ (i+j) % 12 ] );
				nnumbers.push( (i + j) % 12 );
			};
			return { months : nnmonths, numbers: nnumbers };
		}

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
				where.appendChild(field);

				setTimeout(function() {
				    field.focus();
				    setTimeout(function() {
				        field.setAttribute('style', 'display:none;');
				    }, 15);
				}, 15);
			}
		}



		function displayTravelCosts(tdata){
			var ddata = [
				{
					value: tdata.gastos.viaticos,
					color:"#F7464A",
					highlight: "#FF5A5E",
					label: "Viáticos"
				},
				{
					value: tdata.gastos.pasaje,
					color: "#46BFBD",
					highlight: "#5AD3D1",
					label: "Pasaje"
				},
				{
					value: tdata.gastos.hospedaje,
					color: "#FDB45C",
					highlight: "#FFC870",
					label: "Hospedaje"
				}
			];

			var bdata = {
				labels: ["Gasto total", "Comprobados"],
				datasets: [
					{
						label: "Gastos totales VS Gastos comprobados",
						fillColor: "rgba(151,187,205,0.5)",
						strokeColor: "rgba(151,187,205,0.8)",
						highlightFill: "rgba(151,187,205,0.75)",
						highlightStroke: "rgba(151,187,205,1)",
						data: [79, 25]
					}
				]
			};


			var context = document.getElementById('travelCostsBarChart').getContext("2d");
			var bchart = new Chart(context).Bar(bdata,{scaleShowGridLines :false,responsive: true});
			var context = document.getElementById('travelCostsChart').getContext("2d");
			var chart = new Chart(context).Doughnut(ddata,globaldoughnutconf);
		}

		function searchInputFocus(){
			/**
			* Bad practice? bullshit!
			* just take a look at this http://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field
			* this is the fastest and simplest way
			*/
			document.getElementById('search-input').focus();
		}




		//HISTORY HANDLING ::: -----------------------------------------------

		$scope.history = history || window.history;
		window.onpopstate = function(event){
			$scope.$apply(function(){

				if(event.state.travelid)
					$scope.currentTravel = $scope.fullTravels[ event.state.travelid ];
				if(event.state.travellerid)
					$scope.currentTraveller = $scope.fullTravellers[ event.state.travellerid ];
				// $scope.currentTravel = event.state.travelData;
				// $scope.currentTraveller = event.state.travellerData;
				$scope.navigateTo(event.state.status);
			});
		};

		//is something preloaded?
		switch(section){
			case 'chart_panel' :
				$scope.history.replaceState({status:'chart_panel'},null,document.URL);
				$scope.navigateTo('chart_panel');				
			break;			
			case 'welcome_panel' :
				$scope.history.replaceState({status:'welcome_panel'},null,document.URL);
				$scope.navigateTo('welcome_panel');
			break;
			case 'traveller_panel' :
				if(initialData){
					initialData = formatTravellers(initialData);
					$scope.fullTravellers[initialData._id] = initialData;
					$scope.history.pushState({ status: 'welcome_panel' },'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'traveller_panel', travellerid : initialData._id },'Viajes Transparentes',$scope.domain+'servidores/'+initialData._id);
					$scope.currentTraveller = $scope.fullTravellers[initialData._id];
					$scope.navigateTo('traveller_panel');
					getQuestionsForEveryTravelFrom($scope.fullTravellers[initialData._id]);
					displayTravellerCharts($scope.fullTravellers[initialData._id]);
				}
				else
					document.location = '/';
			break;
			case 'travel_panel' :
				if(initialData){
					initialData = format(initialData);
					$scope.fullTravels[initialData._id] = initialData;
					$scope.history.pushState({ status: 'welcome_panel'},'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'travel_panel', travelid : initialData._id },'Viajes Transparentes',$scope.domain+'viajes/'+initialData._id);
					$scope.currentTravel = $scope.fullTravels[initialData._id];
					$scope.navigateTo('travel_panel');
					displayTravelCosts(initialData);
				}
				//redirect!
				else
					document.location = '/';
			break;
			case 'search_panel' :
				$scope.history.pushState({ status: 'welcome_panel' },'Viajes Transparentes',$scope.domain);
				$scope.history.pushState({ status: 'search_panel' },'Viajes Transparentes',$scope.domain+'buscar/');
				$scope.navigateTo('search_panel');
			break;
		}


	});
	
})(console);