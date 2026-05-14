(function () {
  "use strict";

  angular.module("candidate").component("myApplications", {
    templateUrl: "app/candidate/applications.html",
    controller: [
      "apiService",
      "ENUMS",
      "enumService",
      function (apiService, ENUMS, enumService) {
        var vm = this;

        vm.applications = [];
        vm.errorMessage = "";

        vm.statusLabel = function (status) {
          return enumService.labelFor(ENUMS.applicationStatuses, status);
        };

        vm.statusClass = function (status) {
          var option = enumService.optionFor(ENUMS.applicationStatuses, status);
          var name = option ? option.name : status;
          if (!name) {
            return "neutral";
          }
          var normalized = name.toString().toLowerCase();
          if (
            normalized.indexOf("shortlist") >= 0 ||
            normalized.indexOf("offer") >= 0
          ) {
            return "success";
          }
          if (
            normalized.indexOf("applied") >= 0 ||
            normalized.indexOf("interview") >= 0
          ) {
            return "warning";
          }
          if (
            normalized.indexOf("reject") >= 0 ||
            normalized.indexOf("withdraw") >= 0
          ) {
            return "danger";
          }
          return "neutral";
        };

        vm.load = function () {
          vm.errorMessage = "";
          apiService
            .get("/applications/mine")
            .then(function (response) {
              var data = response.data || {};
              vm.applications = data.items || data.Items || [];
            })
            .catch(function () {
              vm.errorMessage = "Unable to load applications.";
            });
        };

        vm.$onInit = function () {
          vm.load();
        };
      },
    ],
  });
})();
