(function () {
  "use strict";

  angular.module("recruiter").component("rankedCandidates", {
    templateUrl: "app/recruiter/ranked-candidates.html",
    controller: [
      "$routeParams",
      "apiService",
      function ($routeParams, apiService) {
        var vm = this;

        vm.candidates = [];
        vm.jobId = $routeParams.jobId;
        vm.errorMessage = "";

        vm.load = function () {
          apiService
            .get("/ai/jobs/" + vm.jobId + "/ranked-candidates")
            .then(function (response) {
              vm.candidates = (response.data || []).sort(function (a, b) {
                return (b.aiMatchScore || 0) - (a.aiMatchScore || 0);
              });
            })
            .catch(function () {
              vm.errorMessage = "Unable to load ranked candidates.";
            });
        };

        vm.$onInit = function () {
          vm.load();
        };
      },
    ],
  });
})();
