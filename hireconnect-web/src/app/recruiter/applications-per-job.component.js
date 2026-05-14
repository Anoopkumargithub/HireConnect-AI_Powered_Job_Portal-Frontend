(function () {
  "use strict";

  angular.module("recruiter").component("applicationsPerJob", {
    templateUrl: "app/recruiter/applications-per-job.html",
    controller: [
      "apiService",
      "authService",
      "ENUMS",
      "enumService",
      function (apiService, authService, ENUMS, enumService) {
        var vm = this;

        vm.jobs = [];
        vm.selectedJobId = null;
        vm.applications = [];
        vm.errorMessage = "";
        vm.activeApplication = null;

        vm.statusLabel = function (status) {
          return enumService.labelFor(ENUMS.applicationStatuses, status);
        };

        vm.loadJobs = function () {
          var userId = authService.getUserId();
          apiService
            .get("/jobs", { params: { page: 1, pageSize: 100 } })
            .then(function (response) {
              var data = response.data || {};
              var items = data.items || data.Items || [];
              vm.jobs = items.filter(function (job) {
                return userId && job.recruiterId === userId;
              });
              if (vm.jobs.length) {
                vm.selectedJobId = vm.jobs[0].jobId;
                vm.loadApplications();
              }
            })
            .catch(function () {
              vm.errorMessage = "Unable to load jobs.";
            });
        };

        vm.loadApplications = function () {
          if (!vm.selectedJobId) {
            return;
          }
          apiService
            .get("/applications/job/" + vm.selectedJobId, {
              params: { page: 1, pageSize: 50 },
            })
            .then(function (response) {
              var data = response.data || {};
              vm.applications = data.items || data.Items || [];
            })
            .catch(function () {
              vm.errorMessage = "Unable to load applications.";
            });
        };

        function updateStatus(application, statusName) {
          var statusValue = enumService.valueFor(
            ENUMS.applicationStatuses,
            statusName,
          );
          return apiService
            .patch("/applications/" + application.applicationId + "/status", {
              newStatus: statusValue,
            })
            .then(function () {
              application.status = statusValue;
            });
        }

        vm.shortlist = function (application) {
          updateStatus(application, "SHORTLISTED");
        };

        vm.reject = function (application) {
          updateStatus(application, "REJECTED");
        };

        vm.openSchedule = function (application) {
          vm.activeApplication = application;
        };

        vm.closeSchedule = function () {
          vm.activeApplication = null;
        };

        vm.$onInit = function () {
          vm.loadJobs();
        };
      },
    ],
  });
})();
