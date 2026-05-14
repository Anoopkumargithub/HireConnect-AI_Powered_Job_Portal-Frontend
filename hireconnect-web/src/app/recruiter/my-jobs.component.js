(function () {
  "use strict";

  angular.module("recruiter").component("myJobs", {
    templateUrl: "app/recruiter/my-jobs.html",
    controller: [
      "apiService",
      "authService",
      "ENUMS",
      "enumService",
      function (apiService, authService, ENUMS, enumService) {
        var vm = this;

        vm.enums = ENUMS;
        vm.jobs = [];
        vm.editingJob = null;
        vm.errorMessage = "";
        vm.statusLabel = function (status) {
          return enumService.labelFor(ENUMS.jobStatuses, status);
        };
        vm.statusClass = function (status) {
          var option = enumService.optionFor(ENUMS.jobStatuses, status);
          var name = option ? option.name : status;
          if (!name) {
            return "neutral";
          }
          var normalized = name.toString().toLowerCase();
          if (normalized.indexOf("active") >= 0) {
            return "success";
          }
          if (normalized.indexOf("paused") >= 0) {
            return "warning";
          }
          if (normalized.indexOf("closed") >= 0) {
            return "danger";
          }
          return "neutral";
        };

        function parseSkills(text) {
          if (!text) {
            return [];
          }
          return text
            .split(",")
            .map(function (skill) {
              return skill.trim();
            })
            .filter(function (skill) {
              return skill.length;
            });
        }

        vm.load = function () {
          var userId = authService.getUserId();
          apiService
            .get("/jobs", { params: { page: 1, pageSize: 100 } })
            .then(function (response) {
              var data = response.data || {};
              var items = data.items || data.Items || [];
              vm.jobs = items.filter(function (job) {
                return userId && job.recruiterId === userId;
              });
            })
            .catch(function () {
              vm.errorMessage = "Unable to load jobs.";
            });
        };

        vm.setStatus = function (job, statusName) {
          var statusValue = enumService.valueFor(ENUMS.jobStatuses, statusName);
          apiService
            .patch("/jobs/" + job.jobId + "/status", { status: statusValue })
            .then(function () {
              job.status = statusValue;
            });
        };

        vm.edit = function (job) {
          vm.editingJob = angular.copy(job);
          vm.editingJob.requiredSkillsText = (
            vm.editingJob.requiredSkills || []
          ).join(", ");
        };

        vm.saveEdit = function () {
          var payload = {
            title: vm.editingJob.title,
            category: vm.editingJob.category,
            type: vm.editingJob.type,
            location: vm.editingJob.location,
            isRemote: !!vm.editingJob.isRemote,
            salaryMin: vm.editingJob.salaryMin
              ? Number(vm.editingJob.salaryMin)
              : null,
            salaryMax: vm.editingJob.salaryMax
              ? Number(vm.editingJob.salaryMax)
              : null,
            currency: vm.editingJob.currency || null,
            description: vm.editingJob.description,
            requiredSkills: parseSkills(vm.editingJob.requiredSkillsText),
            experienceMinYears: Number(vm.editingJob.experienceMinYears || 0),
          };
          apiService
            .put("/jobs/" + vm.editingJob.jobId, payload)
            .then(function () {
              var index = vm.jobs.findIndex(function (job) {
                return job.jobId === vm.editingJob.jobId;
              });
              if (index >= 0) {
                vm.jobs[index] = angular.copy(vm.editingJob);
              }
              vm.editingJob = null;
            })
            .catch(function () {
              vm.errorMessage = "Unable to update job.";
            });
        };

        vm.cancelEdit = function () {
          vm.editingJob = null;
        };

        vm.$onInit = function () {
          vm.load();
        };
      },
    ],
  });
})();
