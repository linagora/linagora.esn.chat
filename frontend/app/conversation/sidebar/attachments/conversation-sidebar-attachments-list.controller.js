(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarAttachmentsListController', ChatConversationSidebarAttachmentsListController);

  function ChatConversationSidebarAttachmentsListController($stateParams, chatConversationsStoreService, CHAT, CHAT_ATTACHMENT_PROVIDER) {
    var self = this;

    self.objectType = CHAT_ATTACHMENT_PROVIDER.conversation;
    self.id = $stateParams.id || chatConversationsStoreService.activeRoom._id;
    self.DEFAULT_FETCH_SIZE = CHAT.DEFAULT_FETCH_SIZE;
  }
})();
