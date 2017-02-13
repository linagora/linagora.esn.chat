(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(chatMessagingRunBlock);

  function chatMessagingRunBlock(session, chatConversationListenerService, chatMessageReceiverService, chatMessengerService) {
    session.ready.then(function() {
      chatMessageReceiverService.addEventListener();
      chatConversationListenerService.addEventListeners();

      chatMessengerService.connect();
    });
  }
})();
