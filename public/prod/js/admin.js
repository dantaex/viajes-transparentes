(function(){
	var app = angular.module('admin',['ui.bootstrap']);

	app.factory('DataService', function($http, $q, $timeout){
		return {
			cities : function(){
				return $http.get( '/cities' )
					.then(function(result) { 
							return result.data.data;
						}, 
						function(){
							console.log('Could not load cities');
						});				
			}
		};
	});

	app.controller('AdminController', function($http, $scope, $q, $timeout, DataService){

		$scope.currentPanel = 'login_panel';
		$scope.ui_adv = '';

		$scope.cities = DataService.cities();
		$scope.cities.then(function(data){
			$scope.cities = data;
		});
		$scope.dateOptions = {
			formatYear: 'yy',
			startingDay: 1
		};


		//got to move this UI shit to another module
		$scope.travel_mec_origen = 'Requerimiento de UR';
		$scope.travel_tipo_rep = 'Técnico';
		$scope.travel_tipo_viaje = 'Nacional';
		$scope.travel_servidor = 'Seleccionar';
		$scope.travel_comision_inicio_opened = false;
		$scope.travel_comision_fin_opened = false;
		$scope.travel_evento_inicio_opened = false;
		$scope.travel_evento_fin_opened = false;
		$scope.travel_hotel_inicio_opened = false;
		$scope.travel_hotel_fin_opened = false;		
		$scope.travel_pasaje= {
			tipo:'Terrestre'
		};
		$scope.navigateTo = function(panel){
			$scope.currentPanel = panel;
		};
		$scope.open_dp_cmi = function($event) {
			$scope.travel_comision_inicio_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};
		$scope.open_dp_cmf = function($event) {
			$scope.travel_comision_fin_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};
		$scope.open_dp_evi = function($event) {
			$scope.travel_evento_inicio_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};
		$scope.open_dp_evf = function($event) {
			$scope.travel_evento_fin_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};
		$scope.open_dp_hoi = function($event) {
			$scope.travel_hotel_inicio_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};
		$scope.open_dp_hof = function($event) {
			$scope.travel_hotel_fin_opened = true;
			$event.preventDefault();
			$event.stopPropagation();
		};



		
		//
		$scope.userData = {};
		$scope.travelData = {};
		
		$scope.createTravel = function(){

			var serializedData = JSON.stringify($scope.travelData);
			var publickey = $scope.userData.publickey;
			var privatekey = $scope.userData.privatekey;
			var accesstoken = Sha256.hash( privatekey + serializedData );
			
			console.log('About to send this:');
			console.log(serializedData);

			$http.post(
					'/travel/'+credentials(publickey,accesstoken,serializedData),
					serializedData
				).then(
					function(response){
						console.log('Server response');
						console.log(response);
					},
					function(){
						console.log('CRASH!');
					}
				);

		};


		$scope.login = function(){
			var email = Sha256.hash($scope.email),
				pass  = Sha256.hash($scope.password),
				started = new Date(),
				accesstoken = Sha256.hash(pass+started.toUTCString());

			authRequest(email,accesstoken,started.toUTCString(), function(response){
				var res = response.data;
				if(res.status== "success"){
					startSession(email,accesstoken,started,pass);
					$scope.userData = res.data;
					$scope.userData.publickey = email;
					$scope.userData.privatekey = pass;
				} else if (res.status == 'error'){
					$scope.ui_adv = 'ar-in';
					setTimeout(function(){ 
						$scope.$apply(function(){
							$scope.ui_adv = 'ar-out';
						});
					 },1500);
				}
			});

		};

		$scope.signout = function(){
			//delete HTML5 storage data when avaliable
			eraseCookie('56465432132564653213');
			document.location = '/adm';
		};

		function startSession(publickey,accesstoken,startDate,privatekey){
			$scope.navigateTo('user_panel');
			var started = startDate.toUTCString();
			data='{"privatekey":"'+privatekey+'","publickey":"'+publickey+'","loginhash":"'+accesstoken+'","started":"'+started+'"}';
			createCookie('56465432132564653213',data,24);
		}
		
		function authRequest(publickey,accesstoken,started, callback){
			$http.get( '/users/'+publickey+credentials(publickey,accesstoken,started) )
				.then(
					callback,
					function(what){ alert('Ocurrió un problema, intente de nuevo'); }
				);				
		}

		function credentials(publickey,accesstoken,data){
			if(data) return '?publickey='+publickey+'&accesstoken='+accesstoken+'&data='+data;
			else	 return '?publickey='+publickey+'&accesstoken='+accesstoken;
		}				

		function createCookie(name,value,days) {
		    if (days) {
		        var date = new Date();
		        date.setTime(date.getTime()+(days*24*60*60*1000));
		        var expires = "; expires="+date.toGMTString();
		    }
		    else var expires = "";
		    document.cookie = name+"="+value+expires+"; path=/";
		}

		function readCookie(name) {
		    var nameEQ = name + "=";
		    var ca = document.cookie.split(';');
		    for(var i=0;i < ca.length;i++) {
		        var c = ca[i];
		        while (c.charAt(0)==' ') c = c.substring(1,c.length);
		        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		    }
		    return null;
		}

		function eraseCookie(name) {
			//yo, blow it up
		    createCookie(name,"",-1);
		}

		//check if logged
		setTimeout(function(){

			var ss = null;
			var cookie = readCookie('56465432132564653213');

			try{

				ss = JSON.parse(cookie);
				console.log('cookie data retrieved ass:');
				console.log(ss);
			} catch(e){
				//not logged
				console.log('not logged in');
			}

			if(ss){
				//if expires > today

				//retrieve stored HTML5 Data
				
				//if HTML5 data isn't avaliable load it from server

				authRequest(ss.publickey, ss.loginhash, ss.started, function(response){
					var res = response.data;
					if(res.status== "success"){
						$scope.userData = res.data;
						$scope.userData.publickey = ss.publickey;
						$scope.userData.privatekey = ss.privatekey;
						$scope.navigateTo('user_panel');
					} else {
						$scope.navigateTo('login_panel');
					}
				});				
			}

		},1500);

	});
})()
