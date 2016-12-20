(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationItem', chatConversationItem());

  function chatConversationItem() {
    return {
      bindings: {
        conversation: '=',
        channelState: '=?'
      },
      controller: 'ChatConversationItemController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/conversation-item.html'
    };
  }
})();
