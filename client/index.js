var app = angular.module('Bonsai', ['youtube-embed', 'btford.socket-io']);

app.controller('PageCtrl', function ($scope, $http, Socket) {
  // have a video id
  $scope.videoID;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1
  };

  $scope.socket = Socket;
  $scope.queue = [];

  $scope.search=function(){
    $http.get('/api/search/'+$scope.searchCriteria)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        console.log(data);
        $scope.searchResults = data.Videos;
      }
    })
  }

  $scope.addToQueue=function(vidinfo){
    $http.post('/api/queue', vidinfo)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('Video Added');
      }
    });
  };

  $scope.$on('youtube.player.ended', function ($event, player) {
    console.log('song is over');
    $scope.socket.emit('song_end');
  });

  Socket.on('queue_updated', function(data){
    $scope.queue = data;
  });

  Socket.on('song_start', function(data){
    $scope.videoID = data.Info.id.videoId;
    $scope.ytplayer.playVideo();
  });

});

app.factory('Socket', function (socketFactory) {
  var myIoSocket = io.connect();
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
});
