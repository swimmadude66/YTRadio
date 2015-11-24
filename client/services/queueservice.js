app.factory('queueService',['$rootScope', 'mediaService', function($rootScope, mediaService){
    var queue =[];

    mediaService.on('queue_updated', function(data){
      queue = data;
      $rootScope.$broadcast('queue_updated', data);
    });

    return {
      checkPresence: function(uname){
        if(!uname){
          return false;
        }
        return (queue.indexOf(uname) > -1);
      },
      getQueue: function(){
        return queue;
      }
    }

}]);
