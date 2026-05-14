(function () {
  "use strict";

  angular
    .module("hireConnectApp")
    .controller("MainController", [
      "$scope",
      "authService",
      "loadingService",
      function ($scope, authService, loadingService) {
        var vm = this;

        vm.role = authService.getRole();

        vm.isLoggedIn = function () {
          return authService.isLoggedIn();
        };

        vm.isLoading = function () {
          return loadingService.isLoading();
        };

        vm.logout = function () {
          authService.logout();
        };

        $scope.$on("auth:changed", function () {
          vm.role = authService.getRole();
        });
      },
    ]);
})();
