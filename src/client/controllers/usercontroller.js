app.controller('UserCtrl', function ($scope, $http, ModalService, authService, mediaService, queueService, toastr) {
  $scope.expand = false;
  $scope.searchResults = [];
  $scope.isSearching = false;
  $scope.isLoading = false;
  $scope.playlists={
    'Default':{
      Name:"Default", Active:true, Contents:[]
    }
  };
  $scope.playlistName="Default";
  $scope.joined=false;

  $scope.isAdding = false;
  $scope.userData = {};
  $scope.newPlaylist = {};
  $scope.addingPlaylist=false;

  fetch_playlist();

  function fetch_playlist(){
    if(!authService.getUser()){
      return;
    }
    $http.get('/api/playlists').then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.playlists = data.Playlists;
        for(var pl in data.Playlists){
          if(data.Playlists[pl].Active){
            $scope.playlistName = data.Playlists[pl].Name;
            break;
          }
        }
      }
      else{
        toastr.error(data.Error, 'Problem retrieving playlist');
      }
    }, function(err){
      toastr.error(err, 'Problem retrieving playlist');
    });
  }

  mediaService.on('nextSong_fetch', function(){
    var vidinfo = $scope.playlists[$scope.playlistName].Contents.shift();
    mediaService.emit('nextSong_response', vidinfo);
    $scope.playlists[$scope.playlistName].Contents.push(vidinfo);
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      var data = res.data;
      if(data.Success){}
      else{
        console.log(data.Error);
      }
    },function(err){
      console.log(err);
    });
  });

  mediaService.on('queue_kick', function(){
    $scope.joined=false;
    toastr.error('You have been removed from the queue');
  });

  /*
  * Client Methods
  */
  $scope.search=function(){
    $scope.isSearching=true;
    $scope.isLoading = true;
    var cleancrit = encodeURIComponent($scope.searchCriteria.query);
    $http.get('/api/search/'+cleancrit)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.searchResults = data.Videos;
      }
      else{
        console.log(data.Error);
        toastr.error('Error completing search');
      }
      $scope.isLoading = false;
    },function(error){
      $scope.isLoading = false;
      toastr.error('Error completing search');
      console.log(error);
    });
  };

  $scope.viewPlaylist=function(name){
    if($scope.playlistName && $scope.playlistName!==name){
      $scope.playlists[$scope.playlistName].Active=false;
    }
    $scope.playlistName=name;
    $scope.playlists[$scope.playlistName].Active=true;
    $scope.isSearching = false;
    $http.post('/api/playlists/setActive', $scope.playlists[name]).then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('new playlist activated');
      }
      else{
        console.log(data.Error);
      }
    });
  };

  $scope.addToPlaylist=function(vidinfo){
    if(!vidinfo){
      return;
    }
    if($scope.playlists[$scope.playlistName].Contents.indexOf(vidinfo) > -1){
      toastr.error('Song already exists in playlist');
      return;
    }
    $scope.playlists[$scope.playlistName].Contents.unshift(vidinfo);
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      if(res.data.Success){
        toastr.success('Song Added to Playlist: ' + $scope.playlistName);
        console.log('playlist updated');
      }
      else{
        console.log(res.data.Error);
      }
    }, function(err){
      console.log(err);
    });
  };

  $scope.removeFromPlaylist=function(ind){
    var item = $scope.playlists[$scope.playlistName].Contents.splice(ind, 1)[0];
    $http.post('/api/playlists/removeItem', {PlaylistName: $scope.playlistName, VideoID: item.ID}).then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('Playlist updated');
      }
      else{
        console.log(data.Error);
      }
    }, function(err){
      console.log(err);
    });
  };

  $scope.moveUp=function(ind){
    var item = $scope.playlists[$scope.playlistName].Contents[ind];
    $scope.playlists[$scope.playlistName].Contents.splice(ind, 1);
    $scope.playlists[$scope.playlistName].Contents.unshift(item);
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('Playlist updated');
      }
      else{
        console.log(data.Error);
      }
    }, function(err){
      console.log(err);
    });
  };

  $scope.moveDown=function(ind){
    var item = $scope.playlists[$scope.playlistName].Contents[ind];
    $scope.playlists[$scope.playlistName].Contents.splice(ind, 1);
    $scope.playlists[$scope.playlistName].Contents.push(item);
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('Playlist updated');
      }
      else{
        console.log(data.Error);
      }
    }, function(err){
      console.log(err);
    });
  };

  $scope.addPlaylist=function(){
    $scope.addingPlaylist = true;
    $scope.newPlaylist = {};
  };

  $scope.registerPlaylist=function(){
    $http.post('/api/playlists/', $scope.newPlaylist).then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.addingPlaylist=false;
        $scope.newPlaylist = {};
        fetch_playlist();
        toastr.success('Added Playlist!');
      }
      else{
        toastr.error(data.Error);
      }
    }, function(err){
      toastr.err('Error connecting to API');
    });
  };

  $scope.joinLeaveQueue=function(){
    if($scope.joined){
      $scope.joined = false;
      var user = authService.getUser();
      if(user){
        console.log('exiting queue');
        $http.delete('/api/radio/queue/'+user.Username).then(function(res){
          var data = res.data;
          if(data.Success){
            return;
          }
          else{
            console.log(data.Error);
            return;
          }
        }, function(err){
          console.log(err);
          return;
        });
      }
    }
    else{
      $scope.joined = true;
      $http.post('/api/radio/queue')
      .then(function(res){
        var data = res.data;
        if(data.Success){
          console.log('added to queue');
        }
        else{
          $scope.joined=false;
          toastr.error(data.Error, 'Could not join Queue');
          console.log(data.Error);
        }
      }, function(err){
        $scope.joined=false;
        console.log(err);
      });
    }
  };

  $scope.login=function(){
    ModalService.showModal({
      templateUrl: "views/auth.html",
      controller: "AuthCtrl"
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {
        fetch_playlist();
        $scope.joined=false;
      });
    });
  };

  $scope.logOut=function(){
    authService.logOut();
  };

  $scope.getUser=function(){
    return authService.getUser();
  };

  $scope.$on('session_resume', function(){
    console.log('resuming session in progress');
    fetch_playlist();
    $scope.joined=false;
  });

});
