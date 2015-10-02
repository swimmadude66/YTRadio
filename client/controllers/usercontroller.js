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

  $http.get('/api/playlists').then(function(res){
    var data = res.data;
    if(data.Success){
      $scope.playlists = data.Playlists;
      for(pl in data.Playlists){
        if(pl.Active){
          $scope.playlistName = pl.Name;
          break;
        }
      }
    }
  });
  $scope.isAdding = false;
  $scope.userData;

  function addToQueue(callback){
    if($scope.playlists[$scope.playlistName].Contents.length <1){
      $scope.isAdding = false;
      return;
    }
    if(checkPresence()){
      $scope.isAdding = false;
      return;
    }
    var vidinfo = $scope.playlists[$scope.playlistName].Contents.shift();
    $http.post('/api/radio/queue', vidinfo)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.playlists[$scope.playlistName].Contents.push(vidinfo);
        $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(){
          callback();
          $scope.isAdding = false;
        });
      }
      else{
        $scope.isAdding = false;
        callback(data.Error);
      }
    }, function(err){
      $scope.isAdding = false;
      callback(err);
    });
  };

  function checkPresence(){
    var present = false;
    var uname = authService.getUser().Username;
    $scope.queue.forEach(function(q_item){
      if(!q_item.DJ || q_item.DJ.toLowerCase() === uname.toLowerCase()){
        present = true;
      }
    });
    return present;
  }


  $scope.$on('queue_updated', function(event, queue){
    $scope.queue = queue;
    if(!$scope.inQueue || $scope.isAdding){
      return;
    }
    if(!checkPresence()){
      $scope.isAdding = true;
      addToQueue(function(err){
        return;
      });
    }
  });

  /*
  * Client Methods
  */
  $scope.search=function(){
    $scope.isSearching=true;
    $scope.isLoading = true;
    console.log('searching for ', $scope.searchCriteria.query);
    var cleancrit = encodeURIComponent($scope.searchCriteria.query)
    $http.get('/api/radio/search/'+cleancrit)
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
    $scope.playlistName=name;
    $scope.isSearching = false;
  }

  $scope.addToPlaylist=function(vidinfo){
    if(!vidinfo){
      return;
    }
    toastr.success('Song Added to Playlist: ' + $scope.playlistName);
    $scope.playlists[$scope.playlistName].Contents.push(vidinfo);
    $http.post('/api/playlists/update', $scope.playlists[$scope.playlistName]).then(function(res){
      console.log('playlist updated');
    });
  }

  $scope.joinLeaveQueue=function(){
    if($scope.inQueue){
      $scope.inQueue = false;
      return;
    }
    $scope.inQueue = true;
    addToQueue(function(err){});
  }

  $scope.login=function(){
    ModalService.showModal({
      templateUrl: "views/auth.html",
      controller: "AuthCtrl"
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {});
    });
  };

  $scope.logOut=function(){
    authService.logOut();
  }

  $scope.getUser=function(){
    return authService.getUser();
  }
});
