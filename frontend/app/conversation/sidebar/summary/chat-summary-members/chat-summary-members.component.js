(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatSummaryMembers', chatSummaryMembers());

  function chatSummaryMembers() {
    return {
      bindings: {
        conversation: '<',
        membersCount: '<',
        members: '<'
      },
      controller: 'chatSummaryMembersController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/summary/chat-summary-members/chat-summary-members.html'
    };
  }
})();
