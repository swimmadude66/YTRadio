var app = angular.module('YTRadio', ['youtube-embed', 'btford.socket-io']);

app.controller('PageCtrl', function ($scope, $http, Socket) {
  // have a video id
  $scope.videoID;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1,
    start: 0
  };
  $scope.novid = true;
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

  $scope.skip = function(){
    $http.get('/api/skip')
    .then(function(res){
      console.log('skipping');
    });
  }

  $scope.$on('youtube.player.ended', function ($event, player) {
    $http.get('/api/songend')
    .then(function(res){
      console.log('sent song-end');
    });
  });

  $scope.$on('youtube.player.paused', function ($event, player) {
    player.playVideo();
  });

  Socket.on('join', function(data){
    $scope.queue = data.videoQueue;
    if(data.currVid){
      $scope.novid = false;
      $scope.videoID = data.currVid.Info.id.videoId;
      $scope.playerVars.start = data.startSeconds;
    }
    else{
      $scope.novid = true;
    }
  });

  Socket.on('queue_updated', function(data){
    $scope.queue = data;
  });

  Socket.on('song_start', function(data){
    if(data){
      $scope.novid = false;
      $scope.videoID = data.Info.id.videoId;
      $scope.playerVars.start = 0;
    }
    else{
      $scope.novid = true;
    }
  });
});

app.factory('Socket', function (socketFactory) {
  var myIoSocket = io.connect();
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
});
