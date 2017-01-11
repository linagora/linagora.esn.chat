(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarAttachmentsController', ChatConversationSidebarAttachmentsController);

  function ChatConversationSidebarAttachmentsController($stateParams, chatLocalStateService, CHAT_ATTACHMENT_PROVIDER) {
    var self = this;

    self.objectType = CHAT_ATTACHMENT_PROVIDER.conversation;
    self.id = $stateParams.id || chatLocalStateService.activeRoom._id;
  }
})();
