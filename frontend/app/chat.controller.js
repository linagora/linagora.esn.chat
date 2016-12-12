(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatController', ChatController);

    function ChatController(chatNotificationService, chatLocalStateService) {
      var self = this;

      self.chatLocalStateService = chatLocalStateService;
      activate();

      function activate() {
        if (!self.chatLocalStateService.activeRoom._id) {
          self.chatLocalStateService.channels[0] && self.chatLocalStateService.setActive(self.chatLocalStateService.channels[0]._id);
        }
      }
    }
})();
