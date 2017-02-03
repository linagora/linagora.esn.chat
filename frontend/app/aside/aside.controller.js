(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatAsideController', chatAsideController);

  function chatAsideController(chatConversationsStoreService, chatNotificationService) {
    var self = this;

    self.chatConversationsStoreService = chatConversationsStoreService;
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
