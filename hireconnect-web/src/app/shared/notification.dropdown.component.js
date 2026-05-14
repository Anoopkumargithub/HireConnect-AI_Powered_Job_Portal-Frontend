(function () {
  "use strict";

  angular.module("shared").component("notificationDropdown", {
    template: [
      '<div class="hc-notification">',
      '  <button class="btn btn-light btn-sm position-relative" ng-click="$ctrl.toggle()">',
      '    <i class="fa-solid fa-bell"></i>',
      '    <span class="hc-count" ng-if="$ctrl.unreadCount > 0">{{$ctrl.unreadCount}}</span>',
      "  </button>",
      '  <div class="hc-dropdown" ng-if="$ctrl.isOpen">',
      '    <div class="p-3 border-bottom">',
      "      <strong>Notifications</strong>",
      "    </div>",
      "    <ul>",
      '      <li ng-repeat="note in $ctrl.notifications">',
      '        <div class="d-flex justify-content-between align-items-start">',
      "          <div>",
      '            <div class="fw-semibold">{{note.title}}</div>',
      '            <div class="text-muted small">{{note.message}}</div>',
      "          </div>",
      '          <button class="btn btn-link btn-sm" ng-click="$ctrl.markRead(note)">Mark read</button>',
      "        </div>",
      "      </li>",
      '      <li ng-if="$ctrl.notifications.length === 0" class="text-center text-muted">No notifications</li>',
      "    </ul>",
      "  </div>",
      "</div>",
    ].join(""),
    controller: [
      "$interval",
      "notificationService",
      function ($interval, notificationService) {
        var vm = this;
        var refreshTimer = null;

        vm.notifications = [];
        vm.unreadCount = 0;
        vm.isOpen = false;

        vm.$onInit = function () {
          notificationService.startPolling();
          vm.unreadCount = notificationService.getUnreadCount();
          refreshTimer = $interval(function () {
            vm.unreadCount = notificationService.getUnreadCount();
          }, 10000);
        };

        vm.$onDestroy = function () {
          if (refreshTimer) {
            $interval.cancel(refreshTimer);
          }
          notificationService.stopPolling();
        };

        vm.toggle = function () {
          vm.isOpen = !vm.isOpen;
          if (vm.isOpen) {
            notificationService.getRecent().then(function (items) {
              vm.notifications = items;
            });
          }
        };

        vm.markRead = function (note) {
          notificationService.markAsRead(note.notificationId).then(function () {
            note.isRead = true;
            notificationService.refreshUnreadCount().then(function (count) {
              vm.unreadCount = count;
            });
          });
        };
      },
    ],
  });
})();
