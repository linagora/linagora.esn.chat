(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationTopbar', chatConversationTopbar());

  function chatConversationTopbar() {
    return {
      templateUrl: '/chat/app/conversation/topbar/conversation-topbar.html',
      controllerAs: 'ctrl',
      controller: 'ChatConversationTopbarController',
      bindings: {
        conversation: '<'
      }
    };
  }
})();
