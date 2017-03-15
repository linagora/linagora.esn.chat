(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationItemIconDm', chatConversationItemIconDm());

  function chatConversationItemIconDm() {
    return {
      bindings: {
        conversation: '='
      },
      controller: 'ChatConversationItemIconDmController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/icon/dm/icon-dm.html'
    };
  }
})();
