(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMembersController', ChatConversationSidebarMembersController);

  function ChatConversationSidebarMembersController($stateParams, chatLocalStateService, CHAT) {
    var self = this;

    self.id = $stateParams.id || chatLocalStateService.activeRoom._id;
    self.conversation = chatLocalStateService.findConversation(self.id);
    self.DEFAULT_FETCH_SIZE = CHAT.DEFAULT_FETCH_SIZE;
  }
})();
