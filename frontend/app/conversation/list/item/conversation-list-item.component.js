(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationListItem', chatConversationListItem());

    function chatConversationListItem() {
      return {
        templateUrl: '/chat/app/conversation/list/item/conversation-list-item.html',
        controllerAs: 'ctrl',
        bindings: {
          conversation: '='
        }
      };
    }
})();
