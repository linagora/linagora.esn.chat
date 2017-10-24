(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatConversationRemoveCrossController', chatConversationRemoveCrossController);

    function chatConversationRemoveCrossController(chatConversationActionsService, chatConversationsStoreService, $state) {
      var self = this;

      self.unsubscribe = unsubscribe;

      function unsubscribe() {
        var defaultChanel = chatConversationsStoreService.channels[0];

        chatConversationActionsService.unsubscribePrivateConversation(self.conversation);

          if (chatConversationsStoreService.isActiveRoom(self.conversation._id)) {
            $state.go('chat.channels-views', { id: defaultChanel._id});
          }
      }
    }
})();
