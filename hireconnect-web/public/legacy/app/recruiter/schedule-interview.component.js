(function () {
  "use strict";

  angular.module("recruiter").component("scheduleInterview", {
    templateUrl: "app/recruiter/schedule-interview.html",
    bindings: {
      application: "<",
      onClose: "&",
    },
    controller: [
      "$routeParams",
      "apiService",
      "ENUMS",
      function ($routeParams, apiService, ENUMS) {
        var vm = this;

        vm.modes = ENUMS.interviewModes;
        vm.standalone = false;

        vm.form = {
          applicationId: "",
          jobId: "",
          candidateId: "",
          candidateEmail: "",
          date: "",
          time: "",
          durationMinutes: 30,
          mode: ENUMS.interviewModes[0].value,
          meetLink: "",
          location: "",
          recruiterNotes: "",
        };
        vm.message = "";
        vm.errorMessage = "";

        function buildScheduledAt(date, time) {
          if (!date || !time) {
            return null;
          }
          return new Date(date + "T" + time);
        }

        vm.$onInit = function () {
          if (vm.application) {
            vm.form.applicationId =
              vm.application.applicationId || vm.application.id;
            vm.form.jobId = vm.application.jobId;
            vm.form.candidateId = vm.application.candidateId;
          } else if ($routeParams.applicationId) {
            vm.form.applicationId = $routeParams.applicationId;
            vm.standalone = true;
          }
        };

        vm.submit = function () {
          vm.message = "";
          vm.errorMessage = "";

          var scheduledAt = buildScheduledAt(vm.form.date, vm.form.time);
          if (
            !vm.form.applicationId ||
            !vm.form.jobId ||
            !vm.form.candidateId ||
            !vm.form.candidateEmail ||
            !scheduledAt
          ) {
            vm.errorMessage =
              "Please fill application, job, candidate, email, date, and time.";
            return;
          }

          var payload = {
            applicationId: vm.form.applicationId,
            jobId: vm.form.jobId,
            candidateId: vm.form.candidateId,
            candidateEmail: vm.form.candidateEmail,
            scheduledAt: scheduledAt,
            durationMinutes: Number(vm.form.durationMinutes || 30),
            mode: vm.form.mode,
            meetLink: vm.form.meetLink || null,
            location: vm.form.location || null,
            recruiterNotes: vm.form.recruiterNotes || null,
          };

          apiService
            .post("/interviews", payload)
            .then(function () {
              vm.message = "Interview scheduled.";
              if (vm.onClose) {
                vm.onClose();
              }
            })
            .catch(function () {
              vm.errorMessage = "Unable to schedule interview.";
            });
        };
      },
    ],
  });
})();
