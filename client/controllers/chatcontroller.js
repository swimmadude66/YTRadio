app.controller('ChatCtrl', function ($scope, $http, authService, chatService) {
  $scope.users=[];
  $scope.messages=[];

  $scope.messageText="";


  $scope.getUser=function(){
    return authService.getUser();
  }

  $scope.sendMessage=function(){
    if(messageText.contents.search(/^@[a-zA-Z0-9]+?:/i)>-1){
      var destuser=messageText.contents.substring(messageText.contents.indexOf("@")+1,messageText.contents.indexOf(":"));
      chatService.emit('privateMessage', {to: destuser, message: encodeURIComponent($scope.messageText.contents)});
    }
    else{
      chatService.emit('message', encodeURIComponent($scope.messageText.contents));
    }
    $scope.messageText="";
  }

  chatService.on('user_join', function(username){
    $scope.messages.push("User "+username+" just joined.");
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
