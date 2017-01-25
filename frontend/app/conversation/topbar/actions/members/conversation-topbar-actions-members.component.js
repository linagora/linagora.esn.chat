(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationTopbarActionsMembers', chatConversationTopbarActionsMembers());

  function chatConversationTopbarActionsMembers() {

    return {
      controller: 'ChatConversationTopbarActionsMembers',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/topbar/actions/members/conversation-topbar-actions-members.html',
      bindings: {
        conversation: '<'
      }
    };
  }
})();
