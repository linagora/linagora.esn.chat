(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatAsideController', chatAsideController);

  function chatAsideController(chatLocalStateService, chatNotificationService) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.isNotificationEnabled = isNotificationEnabled;
    self.toggleNotification = toggleNotification;

    function isNotificationEnabled() {
      return chatNotificationService.isEnabled();
    }

    function toggleNotification() {
      var enable = isNotificationEnabled();

      chatNotificationService.setNotificationStatus(!enable);
      self.isEnabled = !enable;
    }
  }
})();
