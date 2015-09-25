app.controller('RadioCtrl', function ($scope, $http, RadioSocket) {
  $scope.videoID;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1,
    fs:0,
    iv_load_policy:3,
    modestbranding: 1,
    rel: 0,
    start: 0
  };
  $scope.queue = [];
  $scope.novid = true;

  /*
  * Client Methods
  */
  $scope.skip = function(){
    $http.post('/api/radio/skip', {videoID: $scope.videoID})
    .then(function(res){
      console.log('skipping');
    });
  }

  /*
  * Player events
  */
  $scope.$on('youtube.player.ended', function ($event, player) {
    if($scope.playing){
      $scope.playing = false;
      setTimeout(function(){
        $http.post('/api/radio/songend')
        .then(function(res){
          console.log('sent song-end');
        });
      }, 1000);
    }
  });

  $scope.$on('youtube.player.paused', function ($event, player) {
    player.playVideo();
  });

  /*
  * Socket Events
  */

  RadioSocket.on('join', function(data){
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

  RadioSocket.on('queue_updated', function(data){
    $scope.queue = data;
  });

  RadioSocket.on('song_start', function(data){
    if(data.currVid){
      $scope.novid = false;
      $scope.videoID = data.currVid.Info.id.videoId;
      $scope.playerVars.start = 0;
      $scope.playing= true;
    }
    else{
      $scope.novid = true;
      $scope.videoID = null;
    }
    $scope.queue = data.videoQueue;
  });
});

app.factory('RadioSocket', function (socketFactory) {
  var myIoSocket = io.connect();
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
});

app.directive('radioSidebar', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/sidebar.html'
	}
});
