app.controller('UserCtrl', function ($scope, $http, ModalService, authService, mediaService, toastr) {
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
  $scope.inQueue=false;
  $scope.queue =[];
  $scope.isAdding = false;
  $scope.userData;
  fetch_playlist();

  function fetch_playlist(){
    if(!authService.getUser()){
      return;
    }
    $http.get('/api/playlists').then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.playlists = data.Playlists;
        for(pl in data.Playlists){
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

  function addToQueue(callback){
    $scope.isAdding = true;
    if($scope.playlists[$scope.playlistName].Contents.length <1){
      $scope.isAdding = false;
      toastr.error('No song in selected playlist');
      $scope.inQueue = false;
      return;
    }
    if(checkPresence()){
      $scope.isAdding = false;
      return;
    }
    $http.post('/api/radio/queue')
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.isAdding = false;
        return callback();
      }
      else{
        $scope.isAdding = false;
        $scope.inQueue=false;
        toastr.error(data.Error, 'Could not join Queue');
        return callback(data.Error);
      }
    }, function(err){
      $scope.isAdding = false;
      $scope.inQueue=false;
      return callback(err);
    });
  }

  function checkPresence(){
    var uname = (authService.getUser() || {Username:null}).Username;
    if(!uname){
      return false;
    }
    return ($scope.queue.indexOf(uname) > -1);
  }

  $scope.$on('queue_updated', function(event, queue){
    $scope.queue = queue;
    if(!$scope.inQueue || $scope.isAdding){
      return;
    }
    addToQueue(function(err){
      if(err){
        console.log(err);
      }
      return;
    });
  });

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

  /*
  * Client Methods
  */
  $scope.search=function(){
    $scope.isSearching=true;
    $scope.isLoading = true;
    console.log('searching for ', $scope.searchCriteria.query);
    var cleancrit = encodeURIComponent($scope.searchCriteria.query)
    $http.get('/api/search/'+cleancrit)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.searchResults = data.Videos;
      }
      $scope.isLoading = false;
    },function(error){
      $scope.isLoading = false;
      console.log(error);
    });
  }

  $scope.viewPlaylist=function(name){
    var oldpl = null;
    if($scope.playlistName && $scope.playlistName!==name){
      $scope.playlists[$scope.playlistName].Active=false;
      oldpl = $scope.playlistName;
    }
    $scope.playlistName=name;
    $scope.playlists[$scope.playlistName].Active=true;
    $scope.isSearching = false;
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('new playlist activated')
        if(oldpl){
          $http.post('/api/playlists/update', $scope.playlists[oldpl]).then(function(res){
            var data = res.data;
            if(data.Success){
              console.log('old playlist deactivated');
            }
            else{
              console.log(data.Error);
            }
          });
        }
      }
      else{
        console.log(data.Error);
      }
    });
  }

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
  }

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
  }

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
  }

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
  }

  $scope.joinLeaveQueue=function(){
    if($scope.inQueue){
      $scope.inQueue = false;
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
      $scope.inQueue = true;
      addToQueue(function(err){
        if(err){
          console.log(err);
        }
      });
    }
  }

  $scope.login=function(){
    ModalService.showModal({
      templateUrl: "views/auth.html",
      controller: "AuthCtrl"
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {
        fetch_playlist();
      });
    });
  };

  $scope.logOut=function(){
    authService.logOut();
  }

  $scope.getUser=function(){
    return authService.getUser();
  }

  $scope.$on('session_resume', function(){
    console.log('resuming session in progress');
    fetch_playlist();
  });

});
