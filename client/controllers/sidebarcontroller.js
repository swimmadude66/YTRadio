app.controller('SidebarCtrl', function ($scope, $http, authService) {
  $scope.activeTab=0;

  $scope.getUser=function(){
    return authService.getUser();
  }
});

app.directive('queue', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/queue.html'
	}
});

app.directive('userlist', function() {
  return {
    restrict: 'E',
    controller: 'UserListCtrl',
		templateUrl: 'views/users.html'
	}
});

app.directive('chat', function() {
  return {
    restrict: 'E',
    controller: 'ChatCtrl',
		templateUrl: 'views/chat.html'
	}
});

app.directive('settings', function() {
  return {
    restrict: 'E',
    controller: 'SettingsCtrl',
		templateUrl: 'views/settings.html'
	}
});
