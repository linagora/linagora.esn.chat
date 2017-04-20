(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarMember', chatConversationSidebarMember());

  function chatConversationSidebarMember() {
    return {
      controller: 'ChatConversationSidebarMemberController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/member/conversation-sidebar-member.html'
    };
  }
})();
