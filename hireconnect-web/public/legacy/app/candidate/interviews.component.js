(function () {
  "use strict";

  angular.module("candidate").component("interviewSchedule", {
    templateUrl: "app/candidate/interviews.html",
    controller: [
      "apiService",
      "ENUMS",
      "enumService",
      function (apiService, ENUMS, enumService) {
        var vm = this;

        vm.interviews = [];
        vm.errorMessage = "";
        vm.modeLabel = function (mode) {
          return enumService.labelFor(ENUMS.interviewModes, mode);
        };

        vm.statusLabel = function (status) {
          return enumService.labelFor(ENUMS.interviewStatuses, status);
        };

        vm.statusClass = function (status) {
          var option = enumService.optionFor(ENUMS.interviewStatuses, status);
          var name = option ? option.name : status;
          if (!name) {
            return "neutral";
          }
          var normalized = name.toString().toLowerCase();
          if (
            normalized.indexOf("confirm") >= 0 ||
            normalized.indexOf("complete") >= 0
          ) {
            return "success";
          }
          if (
            normalized.indexOf("reschedule") >= 0 ||
            normalized.indexOf("scheduled") >= 0
          ) {
            return "warning";
          }
          if (normalized.indexOf("cancel") >= 0) {
            return "danger";
          }
          return "neutral";
        };

        vm.load = function () {
          apiService
            .get("/interviews/mine")
            .then(function (response) {
              vm.interviews = response.data || [];
            })
            .catch(function () {
              vm.errorMessage = "Unable to load interviews.";
            });
        };

        function buildScheduledAt(date, time) {
          if (!date || !time) {
            return null;
          }
          return new Date(date + "T" + time);
        }

        vm.confirm = function (interview) {
          apiService
            .patch("/interviews/" + interview.interviewId + "/confirm")
            .then(function () {
              interview.status =
                enumService.valueFor(ENUMS.interviewStatuses, "CONFIRMED") ||
                interview.status;
            });
        };

        vm.reschedule = function (interview) {
          var scheduledAt = buildScheduledAt(
            interview.newDate,
            interview.newTime,
          );
          if (!scheduledAt) {
            vm.errorMessage = "Please select a new date and time.";
            return;
          }
          var payload = {
            scheduledAt: scheduledAt,
            durationMinutes:
              interview.newDurationMinutes || interview.durationMinutes || 30,
            meetLink: interview.meetLink || null,
            location: interview.location || null,
          };
          apiService
            .patch(
              "/interviews/" + interview.interviewId + "/reschedule",
              payload,
            )
            .then(function () {
              interview.status =
                enumService.valueFor(ENUMS.interviewStatuses, "RESCHEDULED") ||
                interview.status;
            });
        };

        vm.$onInit = function () {
          vm.load();
        };
      },
    ],
  });
})();
