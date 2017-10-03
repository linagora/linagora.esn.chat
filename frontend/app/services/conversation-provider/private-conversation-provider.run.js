(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(chatPrivateConversationProviderRunBlock);

  function chatPrivateConversationProviderRunBlock(session, chatConversationsStoreService) {
    session.ready.then(function() {
      chatConversationsStoreService.fillPrivateConversations();
    });
  }
})();
