(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationList', chatConversationList());

    function chatConversationList() {
      return {
        templateUrl: '/chat/app/conversation/list/conversation-list.html',
        controller: 'ChatConversationListController',
        controllerAs: 'ctrl'
      };
    }
})();
