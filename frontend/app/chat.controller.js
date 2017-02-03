(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatController', ChatController);

    function ChatController(chatNotificationService, chatConversationsStoreService, chatLastConversationService, chatConversationActionsService, session) {
      var self = this;

      self.chatConversationsStoreService = chatConversationsStoreService;
      self.$onInit = $onInit;

      function $onInit() {
        if (!self.chatConversationsStoreService.activeRoom._id) {
          chatLastConversationService.getConversationId(session.user._id).then(function(conversationId) {
            if (!conversationId) {
              return self.chatConversationsStoreService.channels[0] && chatConversationActionsService.setActive(self.chatConversationsStoreService.channels[0]._id);
            }
            chatConversationActionsService.setActive(conversationId);
          });
        }
      }
    }
})();
