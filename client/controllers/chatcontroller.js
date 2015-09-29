app.controller('ChatCtrl', function ($scope, $http, authService, chatService) {
  $scope.users=[];
  $scope.messages=[];

  $scope.messageText="";


  $scope.getUser=function(){
    return authService.getUser();
  }

  $scope.send=function(){
    chatService.emit('message', encodeURIComponent($scope.messageText));
    $scope.messageText="";
  }

  chatService.on('user_join', function(username){
    $scope.messages.push({Author:{ID:-1, Username:"Server"}, Class:"info", Message:"User "+username+" just joined."});
  });

  chatService.on('message', function(payload){
    $scope.messages.push(payload.sender+": " + decodeURIComponent(payload.message));
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
