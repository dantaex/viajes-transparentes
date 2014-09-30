/**
* Viajes transparentes 
* Made in 3 hours by @dantaex
*/
(function(cc){
	var app = angular.module('viajes',[]);

	app.factory('DataService', function($http, $q, $timeout){
		return {
			viajes : function(input) {
				return $http.get( '/viajes' ).then(function(result) { return result.data.data; }, function(){ alert('Ups! Hubo un problema, por favor reinicia la página'); });
			}
		};
	});

	app.controller('NavigationController', function($http, $scope, $q, $timeout, DataService){

		$scope.fullTravels = {};

		$scope.travels = DataService.viajes();
		$scope.travels.then(function(data){
			$scope.travels = data;
		});

		$scope.history = history || window.history;
		if(initialData){
			cc.log(initialData);
			$scope.history.replaceState({status:null,travelData:initialData},'Viajes Transparentes');
			$scope.currentTravel = initialData;
			$scope.welcome_panel = 'out';
		} else{
			cc.log('FINALLL DATAAAAA');
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
					});
				break;
				case 'travel':
					$scope.$apply(function () {
						$scope.currentTravel = event.state.travelData;
						$scope.welcome_panel = 'out';
					});
				break;
			}
		};


		$scope.view = function(id){
			
			cc.log('server request');
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
						var travel = data.data;
						var transportClass = '';
						if(travel.pasaje.tipo){
							switch(travel.pasaje.tipo){
								case 'Aéreo': transportClass = 'ar-transport-air'; break;
								case 'Terrestre': transportClass = 'ar-transport-land'; break;
								case 'Marítimo': transportClass = 'ar-transport-sea'; break;
							}
						}
						travel.transportClass = transportClass;
						travel.totalCost = _.str.numberFormat( travel.gastos.viaticos + travel.gastos.pasaje + travel.gastos.hospedaje, 2 );
						$scope.fullTravels[travel._id] = travel;
						$scope.welcome_panel = 'out';
						$scope.history.pushState({ status: 'travel', travelData : travel },'Viajes Transparentes',document.URL+travel._id);
						$scope.currentTravel = travel;
					});
			}

		};


	});
	
})(console);