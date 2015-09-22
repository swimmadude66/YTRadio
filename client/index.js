var app = angular.module('Bonsai', ['youtube-embed']);

app.controller('PageCtrl', function ($scope, $http) {
  // have a video id
  $scope.theBestVideo;
  $scope.playerVars = {
    controls: 0,
    autoplay: 1
  };
  get_vid();

  function get_vid(){
    $http.get('/api/nextvideo')
    .then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.theBestVideo = data.vidID;
      }
    });
  }

  $scope.$on('youtube.player.ended', function ($event, player) {
    get_vid();
  });


});
