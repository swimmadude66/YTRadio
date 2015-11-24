app.controller('TheatreCtrl', function ($rootScope, $scope, $http, authService) {
  $scope.playerVars = {
    controls: 0,
    autoplay: 1,
    fs:0,
    iv_load_policy:3,
    modestbranding: 1,
    rel: 0,
    disablekb: 1,
    enablejsapi: 1,
    start: 0
  };
  $scope.playerInfo;
  $scope.novid = true;

  $scope.$on('mute', function($event){
    $scope.ytplayer.mute();
  });

  $scope.$on('unmute', function($event){
    $scope.ytplayer.unMute();
  });

  $scope.$on('setVolume', function($event, volume){
    $scope.ytplayer.setVolume(volume);
  });

  $scope.$on('playVideo', function($event, video, startSeconds){
    if(video){
      $scope.novid = false;
      if($scope.ytplayer && $scope.ytplayer.clearVideo){
        $scope.ytplayer.clearVideo();
        $scope.ytplayer.cueVideoById(video.Info.ID);
        $scope.playerVars.start = startSeconds || 0;
        $scope.ytplayer.playVideo();
      }
      else{
        $scope.playerVars.start = startSeconds || 0;
        $scope.playerInfo = video.Info;
      }
    }
    else{
      $scope.novid = true;
      $scope.playerInfo = null;
      if($scope.ytplayer && $scope.ytplayer.stopVideo){
        $scope.ytplayer.stopVideo();
      }
    }
  });

  /*
  * Player Events
  */
  $scope.$on('youtube.player.playing', function ($event, player) {
    $rootScope.$broadcast('player.playing');
  });

  $scope.$on('youtube.player.ended', function ($event, player) {
    $rootScope.$broadcast('player.ended');
  });

  $scope.$on('youtube.player.paused', function ($event, player) {
    player.playVideo();
  });

});
