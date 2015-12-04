app.controller('UserListCtrl', function ($scope, rootService) {
  $scope.online_users=[];

  rootService.on('userList', function(userlist){
    $scope.online_users = userlist;
  });

  // makes sure all socket event listeners are removed after controller is destroyed
  $scope.$on('$destroy', function (event){
    rootService.removeAllListeners();
  });

});
