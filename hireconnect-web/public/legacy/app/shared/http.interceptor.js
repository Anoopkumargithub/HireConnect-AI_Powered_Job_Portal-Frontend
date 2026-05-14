(function () {
  "use strict";

  angular
    .module("shared")
    .factory("httpInterceptor", [
      "$q",
      "$location",
      "authService",
      function ($q, $location, authService) {
        return {
          request: function (config) {
            var token = authService.getToken();
            if (token) {
              config.headers = config.headers || {};
              config.headers.Authorization = "Bearer " + token;
            }
            return config;
          },
          responseError: function (rejection) {
            if (rejection && rejection.status === 401) {
              authService.logout();
              $location.path("/login");
            }
            return $q.reject(rejection);
          },
        };
      },
    ]);
})();
