(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationItemIconOpen', chatConversationItemIconOpen());

  function chatConversationItemIconOpen() {
    return {
      bindings: {
        conversation: '='
      },
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/item/icon/open/icon-open.html'
    };
  }
})();
