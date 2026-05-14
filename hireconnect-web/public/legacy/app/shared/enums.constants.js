(function () {
  "use strict";

  angular.module("shared").constant("ENUMS", {
    jobCategories: [
      { value: 1, name: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
      { value: 2, name: "DATA_SCIENCE", label: "Data Science" },
      { value: 3, name: "DEVOPS", label: "DevOps" },
      { value: 4, name: "PRODUCT_MANAGEMENT", label: "Product Management" },
      { value: 5, name: "DESIGN", label: "Design" },
      { value: 6, name: "QA", label: "QA" },
      { value: 7, name: "SALES", label: "Sales" },
      { value: 8, name: "MARKETING", label: "Marketing" },
      { value: 9, name: "HR", label: "HR" },
      { value: 10, name: "FINANCE", label: "Finance" },
      { value: 99, name: "OTHER", label: "Other" },
    ],
    jobTypes: [
      { value: 1, name: "FULL_TIME", label: "Full Time" },
      { value: 2, name: "PART_TIME", label: "Part Time" },
      { value: 3, name: "CONTRACT", label: "Contract" },
      { value: 4, name: "INTERNSHIP", label: "Internship" },
    ],
    jobStatuses: [
      { value: 1, name: "DRAFT", label: "Draft" },
      { value: 2, name: "ACTIVE", label: "Active" },
      { value: 3, name: "PAUSED", label: "Paused" },
      { value: 4, name: "CLOSED", label: "Closed" },
    ],
    applicationStatuses: [
      { value: 1, name: "APPLIED", label: "Applied" },
      { value: 2, name: "SHORTLISTED", label: "Shortlisted" },
      { value: 3, name: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
      { value: 4, name: "OFFERED", label: "Offered" },
      { value: 5, name: "REJECTED", label: "Rejected" },
      { value: 6, name: "WITHDRAWN", label: "Withdrawn" },
    ],
    interviewModes: [
      { value: 1, name: "ONLINE", label: "Online" },
      { value: 2, name: "IN_PERSON", label: "In Person" },
    ],
    interviewStatuses: [
      { value: 1, name: "SCHEDULED", label: "Scheduled" },
      { value: 2, name: "CONFIRMED", label: "Confirmed" },
      { value: 3, name: "RESCHEDULED", label: "Rescheduled" },
      { value: 4, name: "CANCELLED", label: "Cancelled" },
      { value: 5, name: "COMPLETED", label: "Completed" },
    ],
  });
})();
