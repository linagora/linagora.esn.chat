(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatController', ChatController);

    function ChatController(chatNotificationService, chatLocalStateService, chatLastConversationService, session) {
      var self = this;

      self.chatLocalStateService = chatLocalStateService;
      activate();

      function activate() {
        if (!self.chatLocalStateService.activeRoom._id) {
          chatLastConversationService.getConversationId(session.user._id).then(function(conversationId) {
            if (!conversationId) {
              return self.chatLocalStateService.channels[0] && self.chatLocalStateService.setActive(self.chatLocalStateService.channels[0]._id);
            }
            self.chatLocalStateService.setActive(conversationId);
          });
        }
      }
    }
})();
