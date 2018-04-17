(function() {
  'use strict';

  angular.module('linagora.esn.chat')

    .component('chatMessagesSearchItem', {
      templateUrl: '/chat/app/search/messages/chat-messages-search-item.html',
      bindings: {
        resultItem: '<'
      },
      controller: 'chatMessagesSearchItemController',
      controllerAs: 'ctrl'
    });

})();
