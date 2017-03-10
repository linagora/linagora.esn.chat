(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMembersController', ChatConversationSidebarMembersController);

  function ChatConversationSidebarMembersController($stateParams, chatConversationsStoreService, ELEMENTS_PER_REQUEST) {
    var self = this;

    self.conversation = chatConversationsStoreService.activeRoom;
    self.DEFAULT_FETCH_SIZE = ELEMENTS_PER_REQUEST;
  }
})();
