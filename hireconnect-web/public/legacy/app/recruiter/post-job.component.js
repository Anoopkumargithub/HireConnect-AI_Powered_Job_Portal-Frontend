(function () {
  "use strict";

  angular.module("recruiter").component("postJob", {
    templateUrl: "app/recruiter/post-job.html",
    controller: [
      "apiService",
      "ENUMS",
      function (apiService, ENUMS) {
        var vm = this;

        vm.enums = ENUMS;

        vm.job = {
          title: "",
          category: null,
          type: null,
          location: "",
          isRemote: false,
          salaryMin: "",
          salaryMax: "",
          currency: "USD",
          description: "",
          requiredSkillsText: "",
          experienceMinYears: 0,
          companyDescription: "",
          tone: "formal",
        };
        vm.message = "";
        vm.errorMessage = "";

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

        vm.generateDescription = function () {
          vm.errorMessage = "";
          var requiredSkills = parseSkills(vm.job.requiredSkillsText);
          if (
            !vm.job.title ||
            !vm.job.location ||
            !vm.job.companyDescription ||
            !vm.job.tone
          ) {
            vm.errorMessage =
              "Please fill title, location, company description, and tone to generate.";
            return;
          }
          apiService
            .post("/ai/jobs/generate-description", {
              title: vm.job.title,
              requiredSkills: requiredSkills,
              experienceYears: Number(vm.job.experienceMinYears || 0),
              location: vm.job.location,
              companyDescription: vm.job.companyDescription,
              tone: vm.job.tone,
            })
            .then(function (response) {
              vm.job.description =
                response.data.fullDescription || vm.job.description;
            })
            .catch(function () {
              vm.errorMessage = "AI generation failed.";
            });
        };

        vm.submit = function () {
          vm.message = "";
          vm.errorMessage = "";
          var payload = {
            title: vm.job.title,
            category: vm.job.category,
            type: vm.job.type,
            location: vm.job.location,
            isRemote: !!vm.job.isRemote,
            salaryMin: vm.job.salaryMin ? Number(vm.job.salaryMin) : null,
            salaryMax: vm.job.salaryMax ? Number(vm.job.salaryMax) : null,
            currency: vm.job.currency || null,
            description: vm.job.description,
            requiredSkills: parseSkills(vm.job.requiredSkillsText),
            experienceMinYears: Number(vm.job.experienceMinYears || 0),
          };
          apiService
            .post("/jobs", payload)
            .then(function () {
              vm.message = "Job posted successfully.";
            })
            .catch(function () {
              vm.errorMessage = "Unable to post job.";
            });
        };
      },
    ],
  });
})();
