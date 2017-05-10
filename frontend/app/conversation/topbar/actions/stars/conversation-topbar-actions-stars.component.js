(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationTopbarActionsStars', chatConversationTopbarActionsStars());

  function chatConversationTopbarActionsStars() {
    return {
      controller: 'ChatConversationTopbarActionsStars',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/topbar/actions/stars/conversation-topbar-actions-stars.html',
      bindings: {
        conversation: '<'
      }
    };
  }
})();
