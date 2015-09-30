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
      chatService.emit('sent_message', encodeURIComponent($scope.messageText.contents));
      console.log('sent message');
      $scope.messageText="";
    }
  }

  chatService.on('user_join', function(username){
    $scope.messages.push("User "+username+" just joined.");
  });

  chatService.on('message', function(payload){
    console.log('message recv');
    $scope.messages.push({Author: payload.sender, Message:decodeURIComponent(payload.message)});
  });

  chatService.on('userList', function(userlist){
    $scope.online_users = userlist;
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
