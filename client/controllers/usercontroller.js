app.controller('UserCtrl', function ($scope, $http) {
  $scope.expand = false;
  $scope.searchResults = [];
  /*
  * Client Methods
  */
  $scope.search=function(){
    $http.get('/api/radio/search/'+$scope.searchCriteria)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.searchResults = data.Videos;
      }
    });
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


});
