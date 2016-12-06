(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatJoinConversation', chatJoinConversationComponent());

  function chatJoinConversationComponent() {
    var component = {
      templateUrl: '/chat/app/conversation/join/join-conversation.html',
      controllerAs: 'ctrl',
      controller: 'ChatJoinConversationController',
      bindings: {
        conversation: '=',
        onJoin: '&?'
      }
    };

    return component;
  }
})();
