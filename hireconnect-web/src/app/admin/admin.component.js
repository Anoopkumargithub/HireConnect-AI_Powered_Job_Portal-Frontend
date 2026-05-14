(function () {
  "use strict";

  angular
    .module("admin")
    .component("adminDashboard", {
      template: [
        '<div class="hc-card">',
        '  <div class="hc-section-title">Admin Dashboard</div>',
        '  <p class="text-muted">Manage users, compliance, and platform health here.</p>',
        '  <div class="hc-grid three">',
        '    <div class="hc-card">',
        '      <div class="fw-semibold">Total Users</div>',
        '      <div class="display-6">12,450</div>',
        '    </div>',
        '    <div class="hc-card">',
        '      <div class="fw-semibold">Active Jobs</div>',
        '      <div class="display-6">1,280</div>',
        '    </div>',
        '    <div class="hc-card">',
        '      <div class="fw-semibold">Pending Reviews</div>',
        '      <div class="display-6">34</div>',
        '    </div>',
        '  </div>',
        '</div>',
      ].join(""),
    });
})();
