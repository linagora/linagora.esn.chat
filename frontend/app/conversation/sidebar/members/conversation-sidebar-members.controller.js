(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMembersController', ChatConversationSidebarMembersController);

  function ChatConversationSidebarMembersController($stateParams, chatConversationsStoreService, CHAT) {
    var self = this;

    self.id = $stateParams.id || chatConversationsStoreService.activeRoom._id;
    self.conversation = chatConversationsStoreService.findConversation(self.id);
    self.DEFAULT_FETCH_SIZE = CHAT.DEFAULT_FETCH_SIZE;
  }
})();
