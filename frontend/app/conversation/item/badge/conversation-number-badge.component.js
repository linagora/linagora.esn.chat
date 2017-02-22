(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationNumberBadge', chatConversationNumberBadge());

  function chatConversationNumberBadge() {
    return {
      bindings: {
        number: '<'
      },
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/badge/conversation-number-badge.html'
    };
  }
})();
