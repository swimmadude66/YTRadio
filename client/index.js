var app = angular.module('YTRadio', [
  'youtube-embed',
  'angularModalService',
  'ngCookies',
  'btford.socket-io',
  'luegg.directives']);

app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('httpRequestInterceptor');
}]);


app.controller('PageCtrl', function ($scope, $http) {


});

app.directive('theatre', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/theatre.html'
	}
});

app.directive('radioSidebar', function() {
  return {
    restrict: 'E',
    controller: 'SidebarCtrl',
		templateUrl: 'views/sidebar.html'
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

app.factory('httpRequestInterceptor', function ($cookies) {
  return {
    request: function(config){
      var auth_token = $cookies.get('ytrk_66') || "";
      config.headers['Authorization'] = auth_token;
      return config;
    }
  };
});
