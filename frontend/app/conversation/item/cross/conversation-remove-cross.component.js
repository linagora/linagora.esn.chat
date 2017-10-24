(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationRemoveCross', chatConversationRemoveCross());

  function chatConversationRemoveCross() {
    return {
      bindings: {
        conversation: '=',
        hover: '<'
      },
      controller: 'chatConversationRemoveCrossController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/cross/conversation-remove-cross.html'
    };
  }
})();
