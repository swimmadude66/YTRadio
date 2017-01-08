app.controller('RadioCtrl', function ($rootScope, $interval, $scope, $http, $cookies, mediaService, authService) {
  $scope.videoInfo={};
  $scope.playing = false;
  $scope.playbackID=null;
  $scope.muted = false;
  $scope.timer=null;
  $scope.timeRemaining = '00:00';
  $scope.premuteVolume=100;
  $scope.volume = 100;

  $scope.vcookie =$cookies.get('ytvolume');
  if($scope.vcookie){
    var vparts = $scope.vcookie.split('|');
    $scope.muted=JSON.parse(vparts[0]);
    $scope.premuteVolume = JSON.parse(vparts[1]);
    $scope.volume = JSON.parse(vparts[2]);
    if($scope.muted){
      $rootScope.$broadcast('mute');
    }
    else{
      $rootScope.$broadcast('setVolume', $scope.volume);
    }
  }

  function saveVolume(){
    var volume_cookie = JSON.stringify($scope.muted)+'|'+$scope.premuteVolume+'|'+$scope.volume;
    var future = new Date().getTime()+(52*7*24*60*60000);
    var eDate = new Date(future);
    $cookies.put('ytvolume', volume_cookie, {expires: eDate});
  }

  /*
  * Client Methods
  */
  $scope.canSkip=function(){
    if(!$scope.playing){
      return false;
    }
    var u = authService.getUser();
    if((u && u.Role === 'ADMIN') || (u && $scope.videoInfo && $scope.videoInfo.DJ.Username === u.Username)){
      return true;
    }
    return false;
  };

  $scope.skip = function(){
    if(!$scope.canSkip()){
      return;
    }
    $http.post('/api/radio/skip', {PlaybackID: $scope.videoInfo.PlaybackID})
    .then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('skipping');
      }
      else{
        console.log(data.Error);
      }
    }, function(err){
      console.log(err);
    });
  };

  $scope.toggleMute=function(){
    if($scope.muted){
      $rootScope.$broadcast('unmute');
      $scope.muted = false;
      $scope.volume = $scope.premuteVolume;
    }
    else{
      $rootScope.$broadcast('mute');
      $scope.muted=true;
      $scope.premuteVolume = $scope.volume;
      $scope.volume=0;
    }
    saveVolume();
  };

  $scope.setVolume=function(){
    $rootScope.$broadcast('setVolume', $scope.volume);
    saveVolume();
  };

  $scope.getUser=function(){
    return authService.getUser();
  };

  /*
  * Player events
  */
  $scope.$on('player.playing', function ($event, player) {
    if($scope.muted){
      $rootScope.$broadcast('mute');
    }
    $rootScope.$broadcast('setVolume', $scope.muted ? $scope.premuteVolume : $scope.volume);
    $scope.timer=$interval(function(){
      var currtime = Math.floor($scope.ytplayer.getCurrentTime());
      var trem = '';
      var minutes = Math.floor(currtime/60);
      var seconds = currtime%60;
      if(minutes >= 60){
        trem += Math.floor(minutes/60) +':';
        minutes = minutes%60;
        if(minutes<10){
          minutes = '0'+minutes;
        }
      }
      trem += minutes +':';
      if(seconds < 10){
        trem += '0';
      }
      trem += seconds;
      $scope.timeRemaining = trem;
    }, 1000);
  });

  $scope.$on('player.ended', function ($event, player) {
    if($scope.timer){
      $interval.cancel($scope.timer);
    }
    $scope.timeRemaining = '00:00';
    setTimeout(function(){
      $http.post('/api/radio/songend', {PlaybackID: $scope.playbackID})
      .then(function(res){
        var data = res.data;
        if(data.Success){
          console.log('sent song-end');
        }
        else{
          console.log(data.Error);
        }
      }, function(err){
        console.log(err);
      });
    }, 1000);
  });

  /*
  * Socket Events
  */

  mediaService.on('join', function(data){
    if(data.currVid){
      $scope.videoInfo = data.currVid.Info;
      $scope.playbackID = data.currVid.Info.PlaybackID;
      $rootScope.$broadcast('playVideo', data.currVid, data.startSeconds);
      $scope.playing = true;
    }
    else{
      $scope.videoInfo = null;
      $scope.timeRemaining='0:00';
      $rootScope.$broadcast('playVideo', null, data.startSeconds);
      $scope.playing=false;
    }
  });

  mediaService.on('song_start', function(data){
    if(data.currVid){
      $scope.videoInfo = data.currVid.Info;
      $scope.playbackID = data.currVid.Info.PlaybackID;
      $rootScope.$broadcast('playVideo', data.currVid, null);
      $scope.playing = true;
    }
    else{
      $scope.videoInfo = null;
      $scope.timeRemaining='0:00';
      $rootScope.$broadcast('playVideo', null, null);
      $scope.playing=false;
    }
  });
});
