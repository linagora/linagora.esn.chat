(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageReceiverService', chatMessageReceiverService);

  function chatMessageReceiverService($log, $rootScope, session, CHAT_MESSAGE_TYPE) {

    return {
      onMessage: onMessage
    };

    function isMeTyping(message) {
      return message.creator && message.creator === session.user._id && message.type === CHAT_MESSAGE_TYPE.USER_TYPING;
    }

    function missingType(message) {
      return !message.type;
    }

    function onMessage(message) {
      $log.debug('Received a message on chat service', message);

      if (!message) {
        $log.debug('Empty message returned, skipping');

        return;
      }

      if (missingType(message)) {
        $log.debug('Message does not have valid type, skipping');

        return;
      }

      if (isMeTyping(message)) {
        $log.debug('Skipping own message');

        return;
      }

      $rootScope.$broadcast('chat:message:' + message.type, message);
    }
  }
})();
