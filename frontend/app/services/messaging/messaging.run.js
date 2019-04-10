(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(chatMessagingRunBlock);

  function chatMessagingRunBlock(session, chatConversationListenerService, chatMessageReceiverService, chatMessengerService, chatConfiguration) {
    chatConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      session.ready.then(function() {
        chatMessageReceiverService.addEventListener();
        chatConversationListenerService.addEventListeners();

        chatMessengerService.connect();
      });
    });
  }
})();
