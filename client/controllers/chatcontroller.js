app.controller('ChatCtrl', function ($scope, $http, authService, chatService) {
  $scope.users=[];
  $scope.messages=[];
  $scope.online_users=[];
  $scope.messageText="";

  $scope.getUser=function(){
    return authService.getUser();
  }

  $scope.sendMessage=function(){
    if($scope.messageText && $scope.messageText.contents && $scope.messageText.contents.trim().length>0){
      chatService.emit('messageToServer', encodeURIComponent($scope.messageText.contents));
      console.log('sent message');
      $scope.messageText="";
    }
  }

  chatService.on('user_join', function(username){
    $scope.messages.push("User "+username+" just joined.");
  });

  chatService.on('messageFromServer', function(payload){
    console.log('message from server', payload);
    $scope.messages.push({Author: payload.sender, Message:decodeURIComponent(payload.message)});
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
