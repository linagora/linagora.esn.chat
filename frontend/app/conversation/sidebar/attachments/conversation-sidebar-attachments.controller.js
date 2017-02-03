(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarAttachmentsController', ChatConversationSidebarAttachmentsController);

  function ChatConversationSidebarAttachmentsController($stateParams, chatConversationsStoreService, CHAT, CHAT_ATTACHMENT_PROVIDER) {
    var self = this;

    self.objectType = CHAT_ATTACHMENT_PROVIDER.conversation;
    self.id = $stateParams.id || chatConversationsStoreService.activeRoom._id;
    self.DEFAULT_FETCH_SIZE = CHAT.DEFAULT_FETCH_SIZE;
  }
})();
