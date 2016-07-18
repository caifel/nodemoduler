var app = angular.module('app', [
	'satellizer'
]);

app.config(function($authProvider) {	
	$authProvider.google({
		url: '/api/auth/google',
		clientId: '1087958558685-hg3pdp4d8mh1d2moq7te8h0oabaq1gqa.apps.googleusercontent.com'
	});
	$authProvider.github({
		url: '/api/auth/github',
		clientId: '8eaa4268af655492d0d7'
	});
});