app.controller('RadioCtrl', function ($scope, $http, mediaService, authService) {
  $scope.videoID;
  $scope.videoInfo;
  $scope.playing = false;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1,
    fs:0,
    iv_load_policy:3,
    modestbranding: 1,
    rel: 0,
    enablejsapi: 1,
    start: 0
  };
  $scope.queue = [];
  $scope.novid = true;
  $scope.muted = false;

  /*
  * Client Methods
  */
  $scope.canSkip=function(){
    var u = authService.getUser();
    if((u && u.Role === 'ADMIN') ||($scope.videoInfo && $scope.videoInfo.DJ === u.Username)){
      return true;
    }
    return false;
  }

  $scope.skip = function(){
    if(!$scope.canSkip()){
      return;
    }
    console.log('Skipping');
    $http.post('/api/radio/skip', {videoID: $scope.videoID})
    .then(function(res){
      console.log('skipping');
    });
  }

  $scope.toggleMute=function(){
    if($scope.muted){
      $scope.ytplayer.unMute();
      $scope.muted=false;
    }
    else{
      $scope.ytplayer.mute();
      $scope.muted=true;
    }
  }

  $scope.getUser=function(){
    return authService.getUser();
  }

  /*
  * Player events
  */
  $scope.$on('youtube.player.playing', function ($event, player) {
    if($scope.muted){
      $scope.ytplayer.mute();
    }
  });

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

  mediaService.on('join', function(data){
    $scope.queue = data.videoQueue;
    if(data.currVid){
      $scope.novid = false;
      $scope.videoInfo = data.currVid.Info;
      $scope.videoID = data.currVid.Info.id.videoId;
      $scope.playerVars.start = data.startSeconds;
      $scope.playing=true;
    }
    else{
      $scope.novid = true;
    }
  });

  mediaService.on('queue_updated', function(data){
    $scope.queue = data;
  });

  mediaService.on('song_start', function(data){
    if(data.currVid){
      $scope.novid = false;
      $scope.videoInfo = data.currVid.Info;
      $scope.videoID = data.currVid.Info.id.videoId;
      $scope.playerVars.start = 0;
      $scope.playing= true;
    }
    else{
      $scope.novid = true;
      $scope.videoInfo = null;
      $scope.videoID = null;
    }
    $scope.queue = data.videoQueue;
  });
});
