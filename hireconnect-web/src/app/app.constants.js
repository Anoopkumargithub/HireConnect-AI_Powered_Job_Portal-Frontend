(function () {
  "use strict";

  var env = window.__ENV__ || {};
  var apiBaseUrl = env.API_BASE_URL || "/api";
  var signalRBaseUrl = env.SIGNALR_BASE_URL || window.location.origin;

  angular
    .module("hireConnectApp")
    .constant("API_BASE_URL", apiBaseUrl)
    .constant("SIGNALR_BASE_URL", signalRBaseUrl);
})();
