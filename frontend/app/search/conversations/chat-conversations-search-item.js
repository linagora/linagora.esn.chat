(function() {
  'use strict';

  angular.module('linagora.esn.chat')

    .component('chatConversationsSearchItem', {
      templateUrl: '/chat/app/search/conversations/chat-conversations-search-item.html',
      bindings: {
        resultItem: '<'
      },
      controller: 'chatConversationsSearchItemController',
      controllerAs: 'ctrl'
    });

})();
