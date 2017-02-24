(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatFabCreateConversation', chatFabCreateConversation());

  function chatFabCreateConversation() {
    return {
      templateUrl: '/chat/app/components/fab/create-conversation/fab-create-conversation.html'
    };
  }
})();
