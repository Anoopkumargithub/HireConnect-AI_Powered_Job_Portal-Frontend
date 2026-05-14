(function () {
  "use strict";

  angular
    .module("hireConnectApp")
    .run([
      "$rootScope",
      "$location",
      "authService",
      function ($rootScope, $location, authService) {
        function roleHome(role) {
          if (role === "Candidate") {
            return "/candidate/jobs";
          }
          if (role === "Recruiter") {
            return "/recruiter/my-jobs";
          }
          if (role === "Admin") {
            return "/admin";
          }
          return "/login";
        }

        $rootScope.$on("$routeChangeStart", function (event, next) {
          if (!next) {
            return;
          }

          var requiresAuth = next.requiresAuth;
          var allowedRoles = next.roles || [];
          var isLoggedIn = authService.isLoggedIn();
          var role = authService.getRole();

          if (requiresAuth && !isLoggedIn) {
            event.preventDefault();
            $location.path("/login");
            return;
          }

          if (requiresAuth && allowedRoles.length && allowedRoles.indexOf(role) === -1) {
            event.preventDefault();
            $location.path(roleHome(role));
            return;
          }

          if (!requiresAuth && isLoggedIn && (next.originalPath === "/login" || next.originalPath === "/register")) {
            event.preventDefault();
            $location.path(roleHome(role));
          }
        });
      },
    ]);
})();
