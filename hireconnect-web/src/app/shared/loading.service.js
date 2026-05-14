(function () {
  "use strict";

  angular
    .module("shared")
    .factory("loadingService", function () {
      var activeRequests = 0;

      function start() {
        activeRequests += 1;
      }

      function stop() {
        activeRequests = Math.max(0, activeRequests - 1);
      }

      function isLoading() {
        return activeRequests > 0;
      }

      return {
        start: start,
        stop: stop,
        isLoading: isLoading,
      };
    });
})();
