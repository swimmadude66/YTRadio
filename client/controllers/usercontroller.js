app.controller('UserCtrl', ['$scope', '$http', 'ModalService', 'authService', 'ChatServ', function ($scope, $http, ModalService, authService, ChatServ) {
  $scope.expand = false;
  $scope.searchResults = [];
  $scope.isSearching = false;
  $scope.playlists={
    'Default':{
      Name:"Default", Active:true, Contents:[]
    }
  };
  $scope.playlist={Name:"Default", Active:true, Contents:[]};
  /*
  * Client Methods
  */
  $scope.search=function(){
    $scope.isSearching=true;
    $http.get('/api/radio/search/'+$scope.searchCriteria)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.searchResults = data.Videos;
      }
    });
  }

  $scope.viewPlaylist=function(name){
    $scope.playlist=$scope.playlists[name];
    $scope.isSearching = false;
  }

  $scope.addToQueue=function(vidinfo){
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
      //it's a bootstrap element, use 'modal' to show it
      modal.element.modal();
      modal.close.then(function(result) {
        console.log(result);
      });
    });
  };


}]);
