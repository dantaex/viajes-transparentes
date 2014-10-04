(function(){
	var app = angular.module('admin',[])
	.controller('AdminController', function($http, $scope, $q, $timeout){
		$scope.login = function(){
			//- var email = Sha256.hash($scope.email),
			//- 	pass  = Sha256.hash($scope.password);
			console.log('hash');
			//- console.log(email);
			//- console.log(pass);
		};
	});
})();