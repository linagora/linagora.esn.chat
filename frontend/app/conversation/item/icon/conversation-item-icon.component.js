(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationItemIcon', chatConversationItemIcon());

  function chatConversationItemIcon() {
    return {
      bindings: {
        conversation: '='
      },
      controller: 'ChatConversationItemIconController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/icon/conversation-item-icon.html'
    };
  }
})();
