(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationItemIconConfidential', chatConversationItemIconConfidential());

  function chatConversationItemIconConfidential() {
    return {
      bindings: {
        conversation: '='
      },
      controller: 'ChatConversationItemIconConfidentialController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/icon/confidential/icon-confidential.html'
    };
  }
})();
