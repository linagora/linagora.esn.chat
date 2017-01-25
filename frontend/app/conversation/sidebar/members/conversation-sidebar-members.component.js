(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarMembers', chatConversationSidebarMembers());

  function chatConversationSidebarMembers() {
    return {
      controller: 'ChatConversationSidebarMembersController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/members/conversation-sidebar-members.html'
    };
  }
})();
