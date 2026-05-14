(function () {
  "use strict";

  angular.module("candidate").component("aiResumeAnalysis", {
    templateUrl: "app/candidate/ai-resume.html",
    controller: [
      "$q",
      "apiService",
      function ($q, apiService) {
        var vm = this;

        vm.resumeFile = null;
        vm.analysis = null;
        vm.errorMessage = "";

        function toBase64(file) {
          var deferred = $q.defer();
          var reader = new FileReader();

          reader.onload = function (event) {
            var result = event.target.result || "";
            var base64 = result.split(",")[1] || "";
            deferred.resolve(base64);
          };

          reader.onerror = function () {
            deferred.reject();
          };

          reader.readAsDataURL(file);
          return deferred.promise;
        }

        vm.analyze = function () {
          vm.errorMessage = "";
          vm.analysis = null;
          if (!vm.resumeFile) {
            vm.errorMessage = "Please upload a resume file.";
            return;
          }

          toBase64(vm.resumeFile)
            .then(function (base64) {
              return apiService.post("/ai/resume/analyze", {
                base64Pdf: base64,
              });
            })
            .then(function (response) {
              vm.analysis = response.data;
            })
            .catch(function () {
              vm.errorMessage = "AI analysis failed. Try again.";
            });
        };
      },
    ],
  });
})();
