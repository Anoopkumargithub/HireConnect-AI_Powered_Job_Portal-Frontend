(function () {
  "use strict";

  angular.module("candidate").component("myProfile", {
    templateUrl: "app/candidate/profile.html",
    controller: [
      "apiService",
      function (apiService) {
        var vm = this;

        vm.profile = {};
        vm.skillsText = "";
        vm.resumeFile = null;
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

        vm.load = function () {
          apiService.get("/profiles/me").then(function (response) {
            vm.profile = response.data || {};
            vm.skillsText = (vm.profile.skills || []).join(", ");
          });
        };

        vm.save = function () {
          vm.message = "";
          vm.errorMessage = "";
          var payload = {
            fullName: vm.profile.fullName || null,
            email: vm.profile.email || null,
            mobile: vm.profile.mobile || null,
            dob: vm.profile.dob || null,
            bio: vm.profile.bio || null,
            skills: parseSkills(vm.skillsText),
            experienceYears: Number(vm.profile.experienceYears || 0),
            linkedinUrl: vm.profile.linkedinUrl || null,
            avatarUrl: vm.profile.avatarUrl || null,
          };
          apiService
            .put("/profiles/candidate", payload)
            .then(function (response) {
              vm.profile = response.data || vm.profile;
              vm.skillsText = (vm.profile.skills || []).join(", ");
              vm.message = "Profile updated successfully.";
            })
            .catch(function () {
              vm.errorMessage = "Unable to update profile.";
            });
        };

        vm.uploadResume = function () {
          if (!vm.resumeFile) {
            return;
          }
          var formData = new FormData();
          formData.append("file", vm.resumeFile);
          apiService
            .uploadMultipart("/profiles/resume/upload", formData)
            .then(function (response) {
              vm.profile.resumeUrl =
                response.data.resumeUrl || vm.profile.resumeUrl;
              vm.message = "Resume uploaded successfully.";
            })
            .catch(function () {
              vm.errorMessage = "Resume upload failed.";
            });
        };

        vm.$onInit = function () {
          vm.load();
        };
      },
    ],
  });
})();
