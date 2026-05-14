(function () {
  "use strict";

  angular.module("auth").component("register", {
    templateUrl: "app/auth/register.html",
    controller: [
      "$location",
      "apiService",
      function ($location, apiService) {
        var vm = this;

        vm.roles = ["Candidate", "Recruiter"];
        vm.form = {
          email: "",
          password: "",
          role: "Candidate",
        };
        vm.errorMessage = "";
        vm.successMessage = "";

        vm.register = function () {
          vm.errorMessage = "";
          vm.successMessage = "";
          apiService
            .post("/auth/register", vm.form)
            .then(function () {
              vm.successMessage = "Registration successful. Please login.";
              $location.path("/login");
            })
            .catch(function () {
              vm.errorMessage =
                "Registration failed. Please check your details.";
            });
        };
      },
    ],
  });
})();
