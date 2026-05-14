(function () {
  "use strict";

  angular
    .module("auth")
    .component("login", {
      templateUrl: "app/auth/login.html",
      controller: [
        "$location",
        "apiService",
        "authService",
        function ($location, apiService, authService) {
          var vm = this;

          vm.credentials = {
            email: "",
            password: "",
          };
          vm.errorMessage = "";

          vm.login = function () {
            vm.errorMessage = "";
            apiService
              .post("/auth/login", vm.credentials)
              .then(function (response) {
                var token = response.data.token || response.data.accessToken;
                authService.setToken(token);
                var role = authService.getRole();
                if (role === "Candidate") {
                  $location.path("/candidate/jobs");
                } else if (role === "Recruiter") {
                  $location.path("/recruiter/my-jobs");
                } else if (role === "Admin") {
                  $location.path("/admin");
                } else {
                  $location.path("/login");
                }
              })
              .catch(function () {
                vm.errorMessage = "Invalid login. Please try again.";
              });
          };
        },
      ],
    });
})();
