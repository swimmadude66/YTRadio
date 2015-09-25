var app = angular.module('YTRadio', ['youtube-embed', 'btford.socket-io']);

app.controller('PageCtrl', function ($scope, $http) {


  $scope.search=function(){
    $http.get('/api/radio/search/'+$scope.searchCriteria)
    .then(function(res){
      var data = res.data;
      if(data.Success){
        console.log(data);
        $scope.searchResults = data.Videos;
      }
    })
  }
});

app.directive('theatre', function() {
  return {
    restrict: 'E',
    controller: 'RadioCtrl',
		templateUrl: 'views/theatre.html'
	}
});
