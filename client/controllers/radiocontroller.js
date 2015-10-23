app.controller('RadioCtrl', function ($rootScope, $interval, $scope, $http, mediaService, authService) {
  $scope.videoInfo;
  $scope.playerInfo;
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
  $scope.novid = true;
  $scope.muted = false;

  $scope.queue = [];

  $scope.timer;
  $scope.timeRemaining = "00:00";

  $scope.premuteVolume=100;
  $scope.volume = 100;

  /*
  * Client Methods
  */
  $scope.getQueue=function(){
    return $scope.queue;
  }

  $scope.canSkip=function(){
    var u = authService.getUser();
    if((u && u.Role === 'ADMIN') || (u && $scope.videoInfo && $scope.videoInfo.DJ === u.Username)){
      return true;
    }
    return false;
  }

  $scope.skip = function(){
    if(!$scope.canSkip()){
      return;
    }
    $http.post('/api/radio/skip', {PlaybackID: $scope.videoInfo.PlaybackID})
    .then(function(res){
      console.log('skipping');
    });
  }

  $scope.toggleMute=function(){
    if($scope.muted){
      $scope.ytplayer.unMute();
      $scope.muted = false;
      $scope.volume = $scope.premuteVolume;
    }
    else{
      $scope.ytplayer.mute();
      $scope.muted=true;
      $scope.premuteVolume = $scope.volume;
      $scope.volume=0;
    }
  }

  $scope.setVolume=function(){
    $scope.ytplayer.setVolume($scope.volume);
  }

  $scope.getUser=function(){
    return authService.getUser();
  }

  $scope.getProgressPercent=function(){
    if(!$scope.playing || ! $scope.ytplayer){
      return 0;
    }
    return ($scope.ytplayer.getCurrentTime()/$scope.ytplayer.getDuration())*100;
  }

  /*
  * Player events
  */
  $scope.$on('youtube.player.playing', function ($event, player) {
    if($scope.muted){
      $scope.ytplayer.mute();
    }
    $scope.ytplayer.setVolume($scope.muted ? $scope.premuteVolume : $scope.volume);
    $scope.timer=$interval(function(){
      var currtime = Math.floor($scope.ytplayer.getCurrentTime());
      var trem = "";
      var minutes = Math.floor(currtime/60);
      var seconds = currtime%60;
      if(minutes > 60){
        trem += Math.floor(minutes/60) +":"
        minutes = minutes%60;
        if(minutes<10){
          minutes = "0"+minutes;
        }
      }
      trem += minutes +":"
      if(seconds < 10){
        trem += 0;
      }
      trem += seconds;
      $scope.timeRemaining = trem;
    }, 1000);
  });

  $scope.$on('youtube.player.ended', function ($event, player) {
    if($scope.timer){
      $interval.cancel($scope.timer);
    }
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
    if(data.currVid){
      $scope.novid = false;
      $scope.playerInfo = data.currVid.Info;
	  $scope.videoInfo = data.currVid.Info;
      $scope.playerVars.start = data.startSeconds;
      $scope.playing = true;
    }
    else{
      $scope.novid = true;
    }
  });

  mediaService.on('queue_updated', function(data){
    $scope.queue = data;
    $rootScope.$broadcast('queue_updated', data);
  });

  mediaService.on('song_start', function(data){
    if(data.currVid){
      $scope.novid = false;
      if($scope.ytplayer && $scope.ytplayer.clearVideo){
        $scope.ytplayer.clearVideo();
        $scope.ytplayer.cueVideoById(data.currVid.Info.ID);
        $scope.ytplayer.playVideo();
      }
      else{
        $scope.playerInfo = data.currVid.Info;
      }
      $scope.videoInfo = data.currVid.Info;
      $scope.playerVars.start = 0;
      $scope.playing = true;
    }
    else{
      $scope.novid = true;
      $scope.videoInfo = null;
      $scope.playerInfo = null;
      if($scope.ytplayer && $scope.ytplayer.stopVideo){
        $scope.ytplayer.stopVideo();
      }
    }
  });
});
