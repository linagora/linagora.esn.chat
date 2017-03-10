(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMembersController', ChatConversationSidebarMembersController);

  function ChatConversationSidebarMembersController($stateParams, chatConversationsStoreService, CHAT) {
    var self = this;

    self.conversation = chatConversationsStoreService.activeRoom;
    self.DEFAULT_FETCH_SIZE = CHAT.DEFAULT_FETCH_SIZE;
  }
})();
