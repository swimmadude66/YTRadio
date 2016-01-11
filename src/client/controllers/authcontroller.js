app.controller('AuthCtrl', function ($scope, $http, $element, authService, close) {
  $scope.action = 'Log in';
  $scope.signupText = false;
  $scope.isLoading = false;

  function closeModal(rval) {
    //  Manually hide the modal using bootstrap.
    $element.modal('hide');
    //  Now close as normal, but give 500ms for bootstrap to animate
    close(rval, 500);
  }

  $scope.toggleAction=function(){
    if($scope.action ==='Log in'){
      $scope.action = 'Sign up';
    }
    else{
      $scope.action ='Log in';
    }
  };

  $scope.submit=function(){
    $scope.isLoading = true;
    if($scope.action === 'Log in'){
      authService.logIn($scope.auth)
      .then(function(session){
          $scope.isLoading = false;
          closeModal(session);
      },function(error){
        $scope.isLoading = false;
        $scope.errormessage=error;
      });
    }
    else{
      authService.signUp($scope.auth)
      .then(function(session){
          $scope.isLoading = false;
          $scope.signupText = true;
      },function(error){
        $scope.isLoading = false;
        $scope.errormessage=error;
      });
    }
  };
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
