(function () {
  "use strict";

  angular
    .module("shared", [])
    .config([
      "$httpProvider",
      function ($httpProvider) {
        $httpProvider.interceptors.push("httpInterceptor");
      },
    ]);
})();
