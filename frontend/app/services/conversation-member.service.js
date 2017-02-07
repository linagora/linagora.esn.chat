(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationMemberService', chatConversationMemberService);

  function chatConversationMemberService(CHAT_MEMBER_STATUS) {
    return {
      currentUserIsMemberOf: currentUserIsMemberOf
    };

    function currentUserIsMemberOf(conversation) {
      return !!(conversation && conversation.member_status && conversation.member_status === CHAT_MEMBER_STATUS.MEMBER);
    }
  }
})();
