app.controller('QueueCtrl', function ($scope, $http, authService, queueService) {

  $scope.getQueue=function(){
    return queueService.getQueue();
  }


});
