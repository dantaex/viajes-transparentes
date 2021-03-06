/**
* Viajes transparentes 
* Made by @dantaex
*/
(function(cc){
	var app = angular.module('viajes',['leaflet-directive']);

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
				return $http.get( '/travellers/?term='+searchinput+'&limit=8' )
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
			},
			similarTrips : function(city){
				return $http.get('/travel/?full=true&by=destinos&term='+city)
					.then(function(response){
							return response.data.data;
						},
						function(){
							return [];
						});
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		var cMonth = (new Date()).getMonth();

		//allmighty beautiful thing
		var fc = new FlowControl();

		$scope.domain = document.URL.match(/http:\/\/[^\/]+\//)[0];
		$scope.alert = '';

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
			donutChart([
				{
					label:'Hospedaje', 
					color:"#F7464A",
					highlight: "#FF5A5E",
					value: Math.floor(META.total_hospedaje * 100) / 100 
				},
				{
					label:'Pasaje', 
					color: "#46BFBD",
					highlight: "#5AD3D1",
					value:Math.floor( META.total_pasaje * 100) / 100
				},
				{
					label:'Viaticos', 
					color: "#FDB45C",
					highlight: "#FFC870",
					value:Math.floor(META.total_viaticos * 100) / 100
				}
				]
				,'enquesegastamas');			
		});	
		//:P


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
			},
			follows : {}
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
								$scope.alert = '';
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
						email : $scope.loggedUser.userData.email || response.email,
						name : response.name,
						profpic :  'http://graph.facebook.com/v2.1/'+response.id+'/picture',
						channel: 'facebook',
						channelData : {
							facebookID : response.id,
							facebookLink : response.link,
							gender : response.gender
						}
					},
					follows : {}
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
						if($scope.fullTravellers[ qdata.to ]){
							//travellers
							for (var i = $scope.fullTravellers[ qdata.to ]._viajes.length - 1; i >= 0; i--) {
								if( $scope.fullTravellers[ qdata.to ]._viajes[i]._id == qdata.about)

									console.log($scope.fullTravellers[ qdata.to ]._viajes[i].questions);
									console.log($scope.fullTravellers[ qdata.to ]._viajes[i]);

									if($scope.fullTravellers[ qdata.to ]._viajes[i].questions)
										$scope.fullTravellers[ qdata.to ]._viajes[i].questions.push(qdata);
									else
										$scope.fullTravellers[ qdata.to ]._viajes[i].questions = [qdata];
							};
						} 

						if($scope.fullTravels[qdata._viaje]) {
							//travel
							$scope.fullTravels[qdata._viaje].questions.push(qdata);
						}

						if($scope.currentTravel){
							$scope.currentTravel.questions.push(qdata);
						}
						
						//clean preview
						$scope.nq.input = '';
						$scope.alert = 'Pregunta enviada';
						setTimeout(function(){
							$scope.$apply(function(){
								$scope.alert = '';
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
		$scope.today = '' + d.getDate() + months[d.getMonth()] + d.getFullYear();


		//SEARCH & AUTOCOMPLETION ::: --------------------------------------------		
		$scope.travelOptions = [];
		$scope.travellerOptions = [];
		$scope.loading = '';

		$scope.searchCategory = 'servidores';
		$scope.searchMode = 'servidores';
		
		$scope.activeSuggestion = 0;
		$scope.suggestionIndex = -1;
		$scope.cities = [];

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
			$scope.cities = idsAsIndexes( data[1] );
		});


		$scope.resetSearch = function( searchCategory,searchMode){
			if(searchCategory)
				$scope.searchCategory = searchCategory;
			if(searchMode)
				$scope.searchMode = searchMode;
			$scope.travelOptions=[];
			$scope.travellerOptions=[];
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
			if( $scope.searchCategory == 'viajes' ){
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
			$scope.alert = 'Enviando suscripción';
			if($scope.subscribed != 'listo'){
				$http.post('/subscriptions',{email:$scope.loggedUser.userData.email})
					.then(function(response) {
							if(response.data.status == 'success'){
								$scope.subscribed = 'listo';
							} else{
								console.log(response);
							}
							$scope.alert = '';
						},
						function(what){
							$scope.alert = 'Ouch, ¡no pudimos suscribir!';
						});
			}
		};



		//UX TRANSITIONS ::: --------------------------------------------------		

		$scope.welcome_panel_class = 'in';
		$scope.travel_panel_class  = 'out';
		$scope.traveller_panel_class  = 'out';
		$scope.search_panel_class  = 'out';
		$scope.chart_panel_class = 'out';
		$scope.compserv_panel_class = 'out';
		$scope.compviaj_panel_class = 'out';
		$scope.map_panel_class = 'out';
		$scope.pkc = false;

		$scope.navigateTo = function(panel,then){
			$scope.welcome_panel_class = 'out';
			$scope.travel_panel_class  = 'out';
			$scope.search_panel_class  = 'out';
			$scope.chart_panel_class   = 'out';
			$scope.traveller_panel_class = 'out';
			$scope.compserv_panel_class = 'out';
			$scope.compviaj_panel_class = 'out';
			$scope.map_panel_class = 'out';
			$scope.pkc = false;

			switch(panel){
				case 'welcome_panel': $scope.welcome_panel_class = 'in'; break;
				case 'search_panel' : $scope.search_panel_class = 'in'; break;
				case 'chart_panel': $scope.chart_panel_class = 'in'; break;
				case 'travel_panel' : $scope.travel_panel_class = 'in'; break;
				case 'traveller_panel' : $scope.traveller_panel_class = 'in'; break;
				case 'compserv_panel' : $scope.compserv_panel_class = 'in'; break;
				case 'compviaj_panel' : $scope.compviaj_panel_class = 'in'; break;
				case 'map_panel' : $scope.map_panel_class = 'in'; break;
			}
			if(typeof then == 'function') then();
			else if(then == 'backward')   $scope.history.back();
		};

		$scope.welcomePanel = function(){
			$scope.navigateTo('welcome_panel',function(){
				$scope.history.pushState({ status: 'welcome_panel' },'Viajes Transparentes',$scope.domain);
				$scope.currentURL = $scope.domain;
			});
		};

		$scope.chartPanel = function(){
			$scope.navigateTo('chart_panel',function(){
				$scope.history.pushState({ status: 'chart_panel' },'Viajes Transparentes',$scope.domain+'graficas/');
				$scope.currentURL = $scope.domain+'graficas/';
			});
		};

		$scope.searchPanel = function(){
			$scope.navigateTo('search_panel',function(){
				$scope.history.pushState({ status: 'search_panel' },'Viajes Transparentes',$scope.domain+'buscar/');
				$scope.currentURL = $scope.domain+'buscar/';
				searchInputFocus();
			});
		};

		$scope.mapPanel = function(){
			$scope.navigateTo('map_panel',function(){
				$scope.history.pushState({ status: 'map_panel' },'Viajes Transparentes',$scope.domain+'mapa/');
				$scope.currentURL = $scope.domain+'mapa/';
			});
		};

		$scope.colorsToCompare = [
			'#47b48d',
			'#542672',
			'#ee763b',
			'#e03646',
			'#b13469',
			'#00a661',
			'#00a5b4',
			'#0077a7',
			'#3c3c3c',
			'#88bd30'
		];

		$scope.compviaj_panel = function(id){
			$scope.navigateTo('compviaj_panel',function(){

				// var compare_list_string = $scope.compareList.viajes.join(':');
				// $scope.history.pushState({ status: 'compviaj_panel' },'Viajes Transparentes',$scope.domain+'comparar_viajes/'+compare_list_string);
				// $scope.currentURL = $scope.domain+'comparar_viajes/';
			});			
		};

		$scope.compserv_panel = function(id){
			$scope.navigateTo('compserv_panel',function(){

				var bardata = {
					labels : ['Número de Viajes'],
					datasets : [],
				};

				var donutdata = [];

				for (var i = 0; i < $scope.colorsToCompare.length && i < $scope.compareList.servidores.length; i++) {
					console.log($scope.compareList.servidores[i]._nviajes);
					donutdata.push({
						label: $scope.compareList.servidores[i].nombre+' - '+$scope.compareList.servidores[i].spent_so_far_mxn_lt,
						color : $scope.colorsToCompare[i],
						value : $scope.compareList.servidores[i].spent_so_far_mxn
					});
					bardata.datasets.push( {
							label : $scope.compareList.servidores[i].nombre,
							fillColor : $scope.colorsToCompare[i],
							data : [ $scope.compareList.servidores[i]._nviajes ]
						});
					$scope.compareList.servidores[i].color = $scope.colorsToCompare[i];
				};

				displayBarChart('compserv_bar',bardata);
				donutChart(donutdata,'compserv_donut');
				// var compare_list_string = $scope.compareList.servidores.join(':');
				// $scope.history.pushState({ status: 'compserv_panel' },'Viajes Transparentes',$scope.domain+'comparar_servidores/'+compare_list_string);
				// $scope.currentURL = $scope.domain+'comparar_servidores/';
			});			
		};

		$scope.fullTravels = {};
		$scope.travelPanel = function(id){
			//if and only if this shit ins't here yet
			if( $scope.fullTravels[id] ){
				getQuestionsForTravel($scope.fullTravels[id]);
				var travel = $scope.fullTravels[id];
				$scope.currentTravel = travel;
				$scope.navigateTo('travel_panel',function(){
					$scope.history.pushState({ status: 'travel_panel', travelid : travel._id },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
					$scope.currentURL = $scope.domain+'viajes/'+travel._id;
					displayTravelCosts(travel);
					$('#travel_panel').scrollTop(0);
				});
			} else {
				cc.log('app::server request:travel');
				$http.get("/travel/"+id)
					.error(function(data, status, headers, config){})
					.success(function(data, status, headers, config) {
						travel = format(data.data);
						travel = $scope.similarTrips(data.data);
						$scope.fullTravels[travel._id] = travel;
						getQuestionsForTravel($scope.fullTravels[travel._id]);
						$scope.currentTravel = travel;
						$scope.navigateTo('travel_panel',function(){
							$scope.history.pushState({ status: 'travel_panel', travelid : travel._id },'Viajes Transparentes',$scope.domain+'viajes/'+travel._id);
							$scope.currentURL = $scope.domain+'viajes/'+travel._id;
							displayTravelCosts(travel);
							$('#travel_panel').scrollTop(0);
						});
					});
			}
		};

			$scope.similarTrips = function(travel){
				var destination;
				for (var i = travel._destinos.length - 1; i >= 0; i--) {
					destination = travel._destinos[i];
				};
				travel.similar = DataService.similarTrips(destination.ciudad);
				travel.similar.then(function(data){				
					var trips = [];
					for (var i = data.length - 1; i >= 0; i--) {
						if(data[i]._id != travel._id){
							trips.push( format(data[i]) );
						}
					};
					travel.similar = trips;
				});
				return travel;
			};

		$scope.fullTravellers = {};
		$scope.travellerPanel = function(id){

			if( $scope.fullTravellers[id] ){
				var traveller = $scope.fullTravellers[id];
				$scope.currentTraveller = traveller;
				displayTravellerCharts(traveller);
				$scope.navigateTo('traveller_panel',function(){
					$scope.history.pushState({ status: 'traveller_panel', travellerid : traveller._id },'Viajes Transparentes',$scope.domain+'servidores/'+traveller._id);
					$scope.currentURL = $scope.domain+'servidores/'+traveller._id;
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
						$scope.currentURL = $scope.domain+'servidores/'+traveller._id;
					});
				});
			}
		};



		$scope.switchMode = function(mode){
			$scope.searchCategory='viajes';
			$scope.searchMode=mode;
			$scope.searchinput='';
			$scope.suggestions=[];
			$scope.travelOptions = [];
			document.getElementById('search-input').focus();
		};


		/**
		* What a compare list needs?
		* - Fast insertion
		* - Fast sorting
		* Remove time doesn't matter much
		*/
		$scope.compareList = {
			size : 0,
			list : {},
			servidores : [],			
			viajes : [],
			add : function(item){
				if(! this.list[item._id] ){
					if(item._origen){
						this.viajes.push(item);
						this.list[item._id] = 'viaje';
					} else	{
						this.servidores.push(item);
						this.list[item._id] = 'servidor';
					}
					this.size++;
				}
			},
			remove : function(id){
				if( this.list[id] ){
					var items = (this.list[id] == 'viaje')? this.viajes: this.servidores;
					var ind = null;
					for (var i = items.length - 1; i >= 0; i--) {
						if(items[i]._id == id)
							ind = i;
					}
					if(ind != null)
						items.splice(ind,1);					
					this.list[id] = false;
					this.size--;
				}
			},
			clear : function(){
				this.list = {};
				this.servidores = [];
				this.viajes = [];
			}
		};
		$scope.compare = function(){
			alert('mmmm');
		};

		//MISC ::: ----------------------------------------------------------

		$scope.pdf = function(id){
			var doc = new jsPDF();
			var source = window.document.getElementById(id);
			var eh = {
				'#ignorePDF1' : function(e,r){return true},
				'#ignorePDF2' : function(e,r){return true},
				'#ignorePDF3' : function(e,r){return true}
			};
			doc.fromHTML( source,	15,	15,	{'width': 180, 'elementHandlers': eh} );
			doc.output("dataurlnewwindow");
		};

		$scope.email = function(id){
			alert('Próximamente');
		};
		
		$scope.tte_expanded = '';
		$scope.expandOrContract = function(){
			$scope.tte_expanded=($scope.tte_expanded=='expanded')? '':'expanded';
		};


		$scope.followModal = 'out';
		$scope.subscribeTo = null;//traveller id
		$scope.followTravellerAttempt = function(travellerid){
			//verificar si tenemos ya su correo
			if($scope.loggedUser.userData.email){
				followTraveller();
			} else {
				$scope.followModal = 'in';
			}
			$scope.subscribeTo = travellerid;
		};
		$scope.followTraveller = function(){
			if($scope.subscribeTo){
				$scope.alert = 'Enviando suscripción';
				$scope.followModal = 'out';
				$http.post('/subscriptions',{email : $scope.loggedUser.userData.email, servidor : $scope.subscribeTo })
					.then(function(res){
						if(res.data.status=='success'){
							$scope.loggedUser.follows[$scope.subscribeTo] = true;
							$scope.alert = 'Suscripción enviada con éxito';
						} else {
							$scope.alert = 'Ouch, hubo un problema al suscribirse';
						}
						setTimeout(function(){
							$scope.$apply(function(){
								$scope.alert = '';
							});
						},1500);
					});

			} else {
				$scope.alert = 'Ese servidor no existe';
				$scope.followModal = 'out';
			}
		};
	
		//UTILITIES ::: --------------------------------------------------

		function getQuestionsForEveryTravelFrom(traveller){
			for (var i = traveller._viajes.length - 1; i >= 0; i--) {
				
				DataService.questions(traveller._viajes[i]._id)
					.then(function(data){
						if(data.length){

							for (var j = data.length - 1; j >= 0; j--) {
								var cd = new Date(data[j].created);
								data[j].on = '' + cd.getDate() +' '+ months[cd.getMonth()] +' '+ cd.getFullYear();
							};

							//look for who the owner is
							for (var k = traveller._viajes.length - 1; k >= 0; k--) {
								if( traveller._viajes[k]._id == data[0]._viaje ){
									traveller._viajes[k].questions = data;
								}
							};

						}

					});

			};
		}

		function getQuestionsForTravel(travel){
			DataService.questions(travel._id)
				.then(function(data){
					for (var j = data.length - 1; j >= 0; j--) {
						var cd = new Date(data[j].created);
						data[j].on = '' + cd.getDate() +' '+ months[cd.getMonth()] +' '+ cd.getFullYear();
					};
					travel.questions = data;
				});
		}


		function formatTravellerOptions(opts){
			for (var i = opts.length - 1; i >= 0; i--) {
				opts[i].nombre = opts[i].nombre.toLowerCase();
				opts[i].puesto = opts[i].puesto.toLowerCase();
				
				opts[i].spent_so_far_mxn_lt = _.str.numberFormat( opts[i].spent_so_far_mxn, 2 );
				opts[i]._nviajes = opts[i].nviajes;
				opts[i].nviajes = (opts[i]._viajes.length==1)? '1 viaje' : opts[i]._viajes.length + ' viajes' ;
			};
			return opts;
		}

		function formatTravellers(traveller){
			traveller.totalSpent = 0.00;
			for (var i = traveller._viajes.length - 1; i >= 0; i--) {
				traveller._viajes[i] = format( traveller._viajes[i] );
				traveller._viajes[i].destino = '';

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
					dia : date.getDate(),
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

			travel.inicio = { dia: travel.comision.inicio.getDate(), mes : months[travel.comision.inicio.getMonth()], anio : travel.comision.inicio.getFullYear() };
			travel.fin = { dia: travel.comision.fin.getDate(), mes : months[travel.comision.fin.getMonth()], anio : travel.comision.fin.getFullYear() };

			if(travel.motivo){
				var m = travel.motivo.charAt(0).toUpperCase();
				travel.motivo = m + travel.motivo.toLowerCase().substr(1);
			} else {
				travel.motivo = '';
			}

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

		function displayBarChart(dom_id,data){
			var context = document.getElementById(dom_id).getContext("2d");
			return new Chart(context).Bar(data,{scaleShowGridLines:false});
		}	

		function displayTravellerCharts(traveller){

			var years = {
				names : ['2010','2011','2012','2013','2014'],
				trips : [0,0,0,0,0]
			}

			for (var i = 0; i < 7; i++) {
				for (var j = traveller._viajes.length - 1; j >= 0; j--) {
					if( (new Date(traveller._viajes[j].comision.inicio)).getFullYear() == years.names[i] )
						years.trips[i]++;
				};
			};

			var data = {
				labels : years.names,
				datasets : [
					{
						fillColor: "rgba(58, 164, 178,0.2)",
						strokeColor: "rgba(58, 164, 178,1)",
						// pointColor: "rgba(220,220,220,1)",
						// pointStrokeColor: "#fff",
						// pointHighlightFill: "#fff",
						// pointHighlightStroke: "rgba(220,220,220,1)",
						data: years.trips
					}
				]
			};

			//timeline
			displayChart('travellerTimeline',data);

			var bardata = {
				labels: ['Propios','Promedio'],
				datasets : [{
					// fillColor: "rgba(152, 188, 65,0.5)",
					// strokeColor: "rgba(152, 188, 65,1)",
					fillColor: "rgba(101, 55, 125,0.5)",
					strokeColor: "rgba(101, 55, 125,1)",
					// pointColor: "rgba(220,220,220,1)",
					// pointStrokeColor: "#fff",
					// pointHighlightFill: "#fff",
					// pointHighlightStroke: "rgba(220,220,220,1)",
					data: [
						traveller._viajes.length,
						META.averageTrips
					]
				}]
			};

			//sus gastos vs promedio
			displayBarChart('tripsAverage',bardata);
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
						fillColor: "#993767",
						highlightFill: "#a34874",
						data: [tdata._totalCost, tdata.gastos.comprobado]
					}
				]
			};


			var context = document.getElementById('travelCostsBarChart').getContext("2d");
			var bchart = new Chart(context).Bar(bdata,{scaleShowGridLines :false,responsive: true});
			var context = document.getElementById('travelCostsChart').getContext("2d");
			var chart = new Chart(context).Doughnut(ddata,globaldoughnutconf);
		}

		function donutChart(data,id){
			var canv = document.getElementById(id);
			if(canv){
				var context = canv.getContext('2d');
				var chart = new Chart(context).Doughnut(data,globaldoughnutconf);
			}
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
			if(event.state){
				switch(event.state.status){
					case 'travel_panel':
						if(event.state.travelid && $scope.fullTravels[ event.state.travelid ]){
							$scope.$apply(function(){
								$scope.currentTravel = $scope.fullTravels[ event.state.travelid ];
							});
						} else {
							//request everything

						}
					break;
					case  'traveller_panel':
						if(event.state.travellerid && $scope.fullTravellers[ event.state.travellerid ]){
							$scope.$apply(function(){
								$scope.currentTraveller = $scope.fullTravellers[ event.state.travellerid ];
							});
						} else {
							//request everything

						}							
					break;
					/*
					*	TODO: move all of these get calls to a proper data service
					*/					
					case 'compviaj_panel':
						if(event.state.compare_list_string){

							if($scope.compareList.viajes.join(':') != event.state.compare_list_string){
								//request everything
								var viajes = event.state.compare_list_string.split(':');
								
								if(viajes.length > 10){
									alert('Demasiados viajes seleccionados!');
									return null;
								}

								fc.taskList(
									viajes,
									function(viaje,next){
										$http.get("/travel/"+viaje)
											.error(function(data, status, headers, config){
												next('err',null);
											})
											.success(function(data, status, headers, config) {
												next(null,format(data.data));
											});
									},
									function(err,everything){
										$scope.$apply(function(){
											for (var i = everything.length - 1; i >= 0; i--) {
												$scope.compareList.add( format(everything[i]) );
											};
										});
									});
							}
							//if not, simply navigate to it								
						}
					break;
					case 'compserv_panel':
						//request everything
						if(event.state.compare_list_string){

							if($scope.compareList.servidores.join(':') != event.state.compare_list_string){
								//request everything
								var servidores = event.state.compare_list_string.split(':');
								
								if(servidores.length > 10){
									alert('Demasiados servidores seleccionados!');
									return null;
								}

								fc.taskList(
									servidores,
									function(servidor_id,next){
										$http.get("/travellers/"+servidor_id)
											.error(function(data, status, headers, config){
												next('err',null);
											})
											.success(function(data, status, headers, config) {
												next(null,format(data.data));
											});
									},
									function(err,everything){
										$scope.$apply(function(){
											for (var i = everything.length - 1; i >= 0; i--) {
												$scope.compareList.add( everything[i] );
											};
										});
									});
							}
							//if not, simply navigate to it								
						}
					break;
				}					

				// $scope.currentTravel = event.state.travelData;
				// $scope.currentTraveller = event.state.travellerData;
				$scope.$apply(function(){
					$scope.navigateTo(event.state.status);
				});
			}
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
					initialData = $scope.similarTrips(initialData);
					$scope.fullTravels[initialData._id] = initialData;
					$scope.history.pushState({ status: 'welcome_panel'},'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'travel_panel', travelid : initialData._id },'Viajes Transparentes',$scope.domain+'viajes/'+initialData._id);
					getQuestionsForTravel($scope.fullTravels[initialData._id]);
					$scope.currentTravel = $scope.fullTravels[initialData._id];
					$scope.navigateTo('travel_panel');
					displayTravelCosts(initialData);
				}
				//redirect!
				else
					document.location = '/';
			break;
			case 'compviaj_panel' :
				if(COMPARE_LIST){
					for (var i = COMPARE_LIST.items.length - 1; i >= 0; i--) {
						$scope.compareList.add(COMPARE_LIST.items[i]);
					};
					$scope.history.pushState({ status: 'welcome_panel'},'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'compviaj_panel', compare_list_string : COMPARE_LIST.compare_list_string },'Viajes Transparentes',$scope.domain+'comparar_viajes/'+COMPARE_LIST.compare_list_string);
					$scope.navigateTo('compviaj_panel');
				} 
				else
					document.location = '/';
			break;
			case 'compserv_panel' :
				if(COMPARE_LIST){
					for (var i = COMPARE_LIST.items.length - 1; i >= 0; i--) {
						$scope.compareList.add(COMPARE_LIST.items[i]);
					};
					$scope.history.pushState({ status: 'welcome_panel'},'Viajes Transparentes',$scope.domain);
					$scope.history.pushState({ status: 'compserv_panel', compare_list_string : COMPARE_LIST.compare_list_string },'Viajes Transparentes',$scope.domain+'comparar_servidores/'+COMPARE_LIST.compare_list_string);
					$scope.navigateTo('compserv_panel');
				} 
				else
					document.location = '/';
			break;			
			case 'search_panel' :
				//modify this to new search in home!!!!
				$scope.history.pushState({ status: 'welcome_panel' },'Viajes Transparentes',$scope.domain);
				$scope.history.pushState({ status: 'search_panel' },'Viajes Transparentes',$scope.domain+'buscar/');
				$scope.navigateTo('search_panel');
			break;
		}
	});


	//Map settings ----------------------------------------------------------------	
	app.controller("MapController", ['$scope', '$http', function($scope, $http) {

		Markers = {};

		//Service para alimentar los markers
		serviceUrl = "//localhost/states";

		$http.get(serviceUrl)
		.then(
			function(resp){
				resp.data.data.forEach(
					function(listElement){
						Markers[listElement._id] = {
							lat: listElement.lat,
							lng: listElement.lon,
							//message recibe un string que permite HTML para darle estilo al popup
							message: "Se han realizado " + listElement.nvisitas + "viajes a " + listElement.ciudad + " con un total de $" + listElement.totalSpent,
							focus: false,
							draggable: false,
							/*Cuando tengan el marker lo ajustan con los siguientes parametros:
							icon: {
								iconUrl: 'leaf-green.png',
							    shadowUrl: 'leaf-shadow.png',
							    iconSize:     [38, 95], // size of the icon
							    shadowSize:   [50, 64], // size of the shadow
							    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
							    shadowAnchor: [4, 62],  // the same for the shadow
							    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
							}*/
						}
					}
				)
			}, 
			function(err) {
				alert("Error: ", err);
		});

	    angular.extend($scope, {
	    	//Si quieren cambiar los tiles, busquen los url aqui:
	    	//http://leaflet-extras.github.io/leaflet-providers/preview/
	    	layers: {
	    		baselayers: {
	    			watercolor: {
	    				name: "Watercolor",
	    				url: "http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png",
			    		type: 'xyz'
	    			}
	    		},
	    		overlays: {
	    			toner: {
	    				name: "Toner",
	    				url: "http://{s}.tile.stamen.com/toner-lines/{z}/{x}/{y}.png",
	    				type: 'xyz',
	    				visible: 'true'
	    			}
	    		}
	    	},

	    	markers: Markers,

	    	center: {
	    		lat: 23.644524198573688,
	    		lng: -101.97509765625,
	    		zoom: 6
	    	},
	        defaults: {
	            scrollWheelZoom: false
	        }
	    });
	}]);
	
})(console);