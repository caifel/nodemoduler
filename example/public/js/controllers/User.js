app.controller('UserCtrl', ['$scope', '$auth', function($scope, $auth) {    
	$scope.user = {
		email: '',
		password: '',
		username: ''
	};
	
	$scope.socialAuth = function (provider) {
		$auth.authenticate(provider);
	};
	
	$scope.logout = function () {
		$auth.logout();
	}
}]);