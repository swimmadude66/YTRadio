app.controller('AuthCtrl', function ($scope, $http, authService, close) {
  $scope.action = 'Log in';

  $scope.toggleAction=function(){
    if($scope.action ==='Log in'){
      $scope.action = 'Sign up';
    }
    else{
      $scope.action ='Log in'
    }
  };

  $scope.submit=function(){
    if($scope.action === 'Log in'){
      authService.logIn($scope.auth)
      .then(function(session){
          console.log(session);
          close(session);
      },function(error){
        $scope.errormessage=error;
      });
    }
    else{
      authService.signUp($scope.auth)
      .then(function(session){
        console.log(session);
          close(session);
      },function(error){
        $scope.errormessage=error;
      });
    }
  }
});

app.directive("compareTo", function() {
  return {
      require: "ngModel",
      scope: {
          otherModelValue: "=compareTo"
      },
      link: function(scope, element, attributes, ctrl) {
          ctrl.$validators.compareTo = function(modelValue) {
              return modelValue === scope.otherModelValue;
          };
      }
  };
});
