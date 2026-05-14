(function () {
  "use strict";

  angular
    .module("hireConnectApp")
    .config([
      "$routeProvider",
      "$locationProvider",
      function ($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix("");

        $routeProvider
          .when("/login", {
            template: "<login></login>",
            requiresAuth: false,
          })
          .when("/register", {
            template: "<register></register>",
            requiresAuth: false,
          })
          .when("/candidate/jobs", {
            template: "<job-search></job-search>",
            requiresAuth: true,
            roles: ["Candidate"],
          })
          .when("/candidate/applications", {
            template: "<my-applications></my-applications>",
            requiresAuth: true,
            roles: ["Candidate"],
          })
          .when("/candidate/profile", {
            template: "<my-profile></my-profile>",
            requiresAuth: true,
            roles: ["Candidate"],
          })
          .when("/candidate/ai-resume", {
            template: "<ai-resume-analysis></ai-resume-analysis>",
            requiresAuth: true,
            roles: ["Candidate"],
          })
          .when("/candidate/interviews", {
            template: "<interview-schedule></interview-schedule>",
            requiresAuth: true,
            roles: ["Candidate"],
          })
          .when("/recruiter/post-job", {
            template: "<post-job></post-job>",
            requiresAuth: true,
            roles: ["Recruiter"],
          })
          .when("/recruiter/my-jobs", {
            template: "<my-jobs></my-jobs>",
            requiresAuth: true,
            roles: ["Recruiter"],
          })
          .when("/recruiter/applications", {
            template: "<applications-per-job></applications-per-job>",
            requiresAuth: true,
            roles: ["Recruiter"],
          })
          .when("/recruiter/ranked-candidates/:jobId", {
            template: "<ranked-candidates></ranked-candidates>",
            requiresAuth: true,
            roles: ["Recruiter"],
          })
          .when("/recruiter/schedule-interview/:applicationId", {
            template: "<schedule-interview></schedule-interview>",
            requiresAuth: true,
            roles: ["Recruiter"],
          })
          .when("/admin", {
            template: "<admin-dashboard></admin-dashboard>",
            requiresAuth: true,
            roles: ["Admin"],
          })
          .otherwise({ redirectTo: "/login" });
      },
    ]);
})();
