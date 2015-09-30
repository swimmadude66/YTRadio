app.controller('UserCtrl', function ($scope, $http, ModalService, authService, toastr) {
  $scope.expand = false;
  $scope.searchResults = [];
  $scope.isSearching = false;
  $scope.isLoading = false;
  $scope.playlists={
    'Default':{
      Name:"Default", Active:true, Contents:[]
    }
  };
  $scope.playlist={Name:"Default", Active:true, Contents:[]};

  $scope.userData;

  /*
  * Client Methods
  */
  $scope.search=function(){
    $scope.isSearching=true;
    $scope.isLoading = true;
    console.log('searching for ', $scope.searchCriteria);
    var cleancrit = encodeURIComponent($scope.searchCriteria)
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
    $scope.playlist=$scope.playlists[name];
    $scope.isSearching = false;
  }

  $scope.addToQueue=function(vidinfo){
    toastr.success('Song Added');
    vidinfo.DJ = authService.getUser().Username;
    $http.post('/api/radio/queue', vidinfo)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        console.log('Video Added');
      }
    });
  };

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
