(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatAsideController', chatAsideController);

  function chatAsideController(chatConversationsStoreService, chatDesktopNotificationService) {
    var self = this;

    self.chatConversationsStoreService = chatConversationsStoreService;
    self.isNotificationEnabled = isNotificationEnabled;
    self.toggleNotification = toggleNotification;

    function isNotificationEnabled() {
      return chatDesktopNotificationService.isEnabled();
    }

    function toggleNotification() {
      var enable = isNotificationEnabled();

      chatDesktopNotificationService.setNotificationStatus(!enable);
      self.isEnabled = !enable;
    }
  }
})();
