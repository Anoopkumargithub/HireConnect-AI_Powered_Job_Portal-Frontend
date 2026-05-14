(function () {
  "use strict";

  angular.module("candidate").component("jobSearch", {
    templateUrl: "app/candidate/job-search.html",
    controller: [
      "apiService",
      "ENUMS",
      "enumService",
      function (apiService, ENUMS, enumService) {
        var vm = this;

        vm.enums = ENUMS;
        vm.categories = ENUMS.jobCategories;
        vm.typeLabel = function (value) {
          return enumService.labelFor(ENUMS.jobTypes, value);
        };
        vm.categoryLabel = function (value) {
          return enumService.labelFor(ENUMS.jobCategories, value);
        };

        vm.filters = {
          keyword: "",
          location: "",
          salaryMin: "",
          salaryMax: "",
          category: null,
          experienceMax: "",
          isRemote: "",
          page: 1,
          pageSize: 9,
        };
        vm.jobs = [];
        vm.errorMessage = "";

        function buildParams() {
          var params = {
            page: vm.filters.page,
            pageSize: vm.filters.pageSize,
          };
          if (vm.filters.keyword) {
            params.keyword = vm.filters.keyword;
          }
          if (vm.filters.location) {
            params.location = vm.filters.location;
          }
          if (vm.filters.category) {
            params.category = vm.filters.category;
          }
          if (vm.filters.salaryMin !== "" && vm.filters.salaryMin !== null) {
            params.salaryMin = Number(vm.filters.salaryMin);
          }
          if (vm.filters.salaryMax !== "" && vm.filters.salaryMax !== null) {
            params.salaryMax = Number(vm.filters.salaryMax);
          }
          if (
            vm.filters.experienceMax !== "" &&
            vm.filters.experienceMax !== null
          ) {
            params.experienceMax = Number(vm.filters.experienceMax);
          }
          if (vm.filters.isRemote !== null && vm.filters.isRemote !== "") {
            params.isRemote =
              vm.filters.isRemote === "true"
                ? true
                : vm.filters.isRemote === "false"
                  ? false
                  : vm.filters.isRemote;
          }
          return params;
        }

        vm.search = function () {
          vm.errorMessage = "";
          apiService
            .get("/jobs", { params: buildParams() })
            .then(function (response) {
              var data = response.data || {};
              vm.jobs = data.items || data.Items || [];
            })
            .catch(function () {
              vm.errorMessage = "Unable to load jobs right now.";
            });
        };

        vm.formatSalary = function (job) {
          if (!job) {
            return "";
          }
          if (job.salaryMin && job.salaryMax) {
            return "$" + job.salaryMin + " - $" + job.salaryMax;
          }
          if (job.salaryMin) {
            return "From $" + job.salaryMin;
          }
          if (job.salaryMax) {
            return "Up to $" + job.salaryMax;
          }
          return "Salary not specified";
        };

        vm.apply = function (job) {
          vm.errorMessage = "";
          if (!job || !job.jobId || !job.recruiterId) {
            vm.errorMessage = "Job data incomplete. Please refresh.";
            return;
          }
          apiService
            .post("/applications", {
              jobId: job.jobId,
              recruiterId: job.recruiterId,
            })
            .then(function () {
              job.applied = true;
            })
            .catch(function () {
              vm.errorMessage = "Application failed. Please try again.";
            });
        };

        vm.$onInit = function () {
          vm.search();
        };
      },
    ],
  });
})();
