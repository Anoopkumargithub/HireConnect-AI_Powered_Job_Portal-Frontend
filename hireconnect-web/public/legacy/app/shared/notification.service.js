(function () {
  "use strict";

  angular.module("shared").factory("notificationService", [
    "$interval",
    "apiService",
    function ($interval, apiService) {
      var unreadCount = 0;
      var pollPromise = null;

      function refreshUnreadCount() {
        return apiService
          .get("/notifications/unread-count")
          .then(function (response) {
            unreadCount = response.data.unread || 0;
            return unreadCount;
          });
      }

      function startPolling() {
        if (!pollPromise) {
          pollPromise = $interval(refreshUnreadCount, 30000);
          refreshUnreadCount();
        }
      }

      function stopPolling() {
        if (pollPromise) {
          $interval.cancel(pollPromise);
          pollPromise = null;
        }
      }

      function getUnreadCount() {
        return unreadCount;
      }

      function getRecent() {
        return apiService
          .get("/notifications", { params: { page: 1, pageSize: 5 } })
          .then(function (response) {
            return (response.data && response.data.items) || [];
          });
      }

      function markAsRead(notificationId) {
        return apiService.patch("/notifications/" + notificationId + "/read");
      }

      return {
        startPolling: startPolling,
        stopPolling: stopPolling,
        getUnreadCount: getUnreadCount,
        refreshUnreadCount: refreshUnreadCount,
        getRecent: getRecent,
        markAsRead: markAsRead,
      };
    },
  ]);
})();
