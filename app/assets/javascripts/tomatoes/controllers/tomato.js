angular.module("Pomodoro").controller("TomatoController", [
  "$scope", "$rootScope",
  function ($scope, $rootScope) {
    this.editMode = false;

    this.enterEditMode = function () {
      this.rollBackAttributes = angular.copy($scope.tomato.attributes);
      this.editMode = true;
    };

    this.keyPress = function (evt) {
      if (evt.keyCode !== 27) { return; }
      $scope.tomato.set(this.rollBackAttributes);
      this.editMode = false;
    };

    this.update = function () {
      $scope.submitPromise = $scope.tomato.save();

      $scope.submitPromise.success(angular.bind(this, function () {
        this.editMode = false;
      }));
    };

    this.showStartButton = function () {
      return $scope.$index === 0;
    };

    this.start = function () {
      $rootScope.$broadcast("counter:start", $scope.tomato);
    };

    this.remove = function () {
      $scope.tomato.destroy();
    };
  }
]);
