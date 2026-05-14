(function () {
  "use strict";

  angular.module("shared").factory("apiService", [
    "$http",
    "API_BASE_URL",
    "loadingService",
    function ($http, API_BASE_URL, loadingService) {
      var normalizedBase = (API_BASE_URL || "").replace(/\/+$/, "");

      function handleRequest(promise) {
        loadingService.start();
        return promise.finally(function () {
          loadingService.stop();
        });
      }

      function buildUrl(path) {
        if (!path) {
          return normalizedBase;
        }
        if (path.indexOf("http") === 0) {
          return path;
        }
        var normalizedPath = path.indexOf("/") === 0 ? path : "/" + path;
        return normalizedBase + normalizedPath;
      }

      function get(path, config) {
        return handleRequest($http.get(buildUrl(path), config));
      }

      function post(path, data, config) {
        return handleRequest($http.post(buildUrl(path), data, config));
      }

      function put(path, data, config) {
        return handleRequest($http.put(buildUrl(path), data, config));
      }

      function patch(path, data, config) {
        return handleRequest($http.patch(buildUrl(path), data, config));
      }

      function remove(path, config) {
        return handleRequest($http.delete(buildUrl(path), config));
      }

      function uploadMultipart(path, formData) {
        return handleRequest(
          $http.post(buildUrl(path), formData, {
            transformRequest: angular.identity,
            headers: { "Content-Type": undefined },
          }),
        );
      }

      return {
        get: get,
        post: post,
        put: put,
        patch: patch,
        remove: remove,
        uploadMultipart: uploadMultipart,
      };
    },
  ]);
})();
