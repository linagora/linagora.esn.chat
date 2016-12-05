(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatController', ChatController);

    ChatController.$inject = ['chatNotificationService', 'chatLocalStateService'];

    function ChatController(chatNotificationService, chatLocalStateService) {
      var self = this;

      self.isEnabled = isEnabled;
      self.chatLocalStateService = chatLocalStateService;
      activate();

      function activate() {
        if (!self.chatLocalStateService.activeRoom._id) {
          self.chatLocalStateService.channels[0] && self.chatLocalStateService.setActive(self.chatLocalStateService.channels[0]._id);
        }
      }

      function isEnabled() {
        return chatNotificationService.isEnabled();
      }
    }
})();
