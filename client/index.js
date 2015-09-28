var app = angular.module('YTRadio', ['youtube-embed', 'YTRadio.Chat.service']);

app.controller('PageCtrl', function ($scope, $http) {


});

app.directive('theatre', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/theatre.html'
	}
});

app.directive('radioControls', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/radiocontrols.html'
	}
});

app.directive('userControls', function() {
  return {
    restrict: 'E',
    controller: 'UserCtrl',
		templateUrl: 'views/usercontrols.html'
	}
});
