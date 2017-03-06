(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageReceiverService', chatMessageReceiverService);

  function chatMessageReceiverService(
    $log,
    chatConversationActionsService,
    chatMessengerService,
    CHAT_MESSAGE_PREFIX,
    CHAT_WEBSOCKET_EVENTS
  ) {

    return {
      addEventListener: addEventListener,
      onMessage: onMessage
    };

    function addEventListener() {
      chatMessengerService.addEventListener(CHAT_WEBSOCKET_EVENTS.MESSAGE, onMessage);
    }

    function isMissingType(message) {
      return !message.type;
    }

    function onMessage(message) {
      $log.debug('Received a message on chat service', message);

      if (!message) {
        $log.debug('Empty message returned, skipping');

        return;
      }

      if (isMissingType(message)) {
        $log.debug('Message does not have valid type, skipping');

        return;
      }

      chatConversationActionsService.onMessage(CHAT_MESSAGE_PREFIX + message.type, message);
    }
  }
})();
