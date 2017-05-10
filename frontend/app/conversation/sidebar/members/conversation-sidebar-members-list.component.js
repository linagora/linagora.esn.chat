(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarMembersList', chatConversationSidebarMembersList());

  function chatConversationSidebarMembersList() {
    return {
      controller: 'ChatConversationSidebarMembersListController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/members/conversation-sidebar-members-list.html'
    };
  }
})();
