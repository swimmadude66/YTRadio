app.controller('UserListCtrl', function ($scope, chatService) {
  $scope.online_users=[];

  chatService.on('userList', function(userlist){
    $scope.online_users = userlist;
  });

  // makes sure all socket event listeners are removed after controller is destroyed
  $scope.$on('$destroy', function (event){
    chatService.removeAllListeners();
  });

});

/*
app.directive('chatmessage', function() {
  return {
    restrict: 'E',
    controller: 'ChatCtrl',
		templateUrl: 'views/chatmessage.html'
	}
});
*/
