app.controller('ChatCtrl', function ($scope, $http, authService, chatService) {
  $scope.users=[];
  $scope.messages=[];
  $scope.online_users=[];
  $scope.messageText="";

  $scope.getUser=function(){
    return authService.getUser();
  };

  $scope.sendMessage=function(){
    if($scope.messageText && $scope.messageText.contents && $scope.messageText.contents.trim().length>0){
      chatService.emit('messageToServer', encodeURIComponent($scope.messageText.contents));
      $scope.messageText.contents="";
    }
  };

  chatService.on('motd', function(message){
    $scope.messages.push({Author: "MotD", Message:message});
  });

  chatService.on('user_join', function(username){
    $scope.messages.push({Author: "Server", Message:"User "+username+" just joined."});
  });

  chatService.on('user_left', function(username){
    $scope.messages.push({Author: "Server", Message:"User "+username+" jumped ship."});
  });

  chatService.on('messageFromServer', function(payload){
    $scope.messages.push({Author: payload.sender, Message:decodeURIComponent(payload.message)});
    if($scope.messages.length>100){
      $scope.messages.splice(0,$scope.messages.length-100);
      console.log($scope.messages.length);
    }
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
