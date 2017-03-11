(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatBotMessageNotMemberMention', {
        bindings: {
          conversationId: '=',
          parsed: '=',
          userMentions: '='
        },
        templateUrl: '/chat/app/conversation/message/bot/handlers/notmember-mention/notmember-mention.html',
        controller: 'chatBotMessageNotMemberMentionController',
        controllerAs: 'ctrl'
      });
})();
