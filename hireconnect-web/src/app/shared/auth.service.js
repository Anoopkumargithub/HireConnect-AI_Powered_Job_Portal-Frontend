(function () {
  "use strict";

  angular.module("shared").factory("authService", [
    "$window",
    "$rootScope",
    "$location",
    function ($window, $rootScope, $location) {
      var storageKey = "hc_jwt";

      function setToken(token) {
        if (token) {
          $window.localStorage.setItem(storageKey, token);
          $rootScope.$broadcast("auth:changed");
        }
      }

      function getToken() {
        return $window.localStorage.getItem(storageKey);
      }

      function decodeJwt(token) {
        if (!token) {
          return null;
        }
        var parts = token.split(".");
        if (parts.length !== 3) {
          return null;
        }
        var payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        try {
          var decoded = $window.atob(payload);
          return JSON.parse(decoded);
        } catch (error) {
          return null;
        }
      }

      function getRole() {
        var payload = decodeJwt(getToken());
        if (!payload) {
          return null;
        }
        if (payload.role) {
          return payload.role;
        }
        if (payload.roles && payload.roles.length) {
          return payload.roles[0];
        }
        return null;
      }

      function getUserId() {
        var payload = decodeJwt(getToken());
        if (!payload) {
          return null;
        }
        return payload.userId || payload.sub || payload.nameid || null;
      }

      function isLoggedIn() {
        return !!getToken();
      }

      function logout() {
        $window.localStorage.removeItem(storageKey);
        $rootScope.$broadcast("auth:changed");
        $location.path("/login");
      }

      return {
        setToken: setToken,
        getToken: getToken,
        getRole: getRole,
        getUserId: getUserId,
        isLoggedIn: isLoggedIn,
        logout: logout,
        decodeJwt: decodeJwt,
      };
    },
  ]);
})();
