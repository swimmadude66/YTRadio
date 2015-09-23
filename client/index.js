var app = angular.module('YTRadio', ['youtube-embed', 'btford.socket-io']);

app.controller('PageCtrl', function ($scope, $http, Socket) {
  // have a video id
  $scope.videoID;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1,
    start: 0
  };

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
    $http.get('/api/songend')
    .then(function(res){
      console.log('sent song-end');
    });
  });

  Socket.on('join', function(data){
    $scope.queue = data.videoQueue;
    $scope.playerVars.start = data.startSeconds;
    console.log($scope.playerVars);
    $scope.videoID = data.Info.id.videoId;
  });

  Socket.on('queue_updated', function(data){
    $scope.queue = data;
  });

  Socket.on('song_start', function(data){
    console.log('new song received');
    console.log(data);
    $scope.videoID = data.Info.id.videoId;
    $scope.playerVars.start = 0;
  });
});

app.factory('Socket', function (socketFactory) {
  var myIoSocket = io.connect();
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
});
