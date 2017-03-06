(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageUtilsService', chatMessageUtilsService);

  function chatMessageUtilsService(session, CHAT_MESSAGE_TYPE) {
    return {
      isMeTyping: isMeTyping
    };

    function isMeTyping(message) {
      return message.creator && message.creator === session.user._id && message.type === CHAT_MESSAGE_TYPE.USER_TYPING;
    }
  }
})();
