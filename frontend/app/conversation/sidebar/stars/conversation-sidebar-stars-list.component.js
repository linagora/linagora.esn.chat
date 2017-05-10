(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarStarsList', chatConversationSidebarStarsList());

  function chatConversationSidebarStarsList() {
    return {
      controller: 'ChatConversationSidebarStarsListController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/stars/conversation-sidebar-stars-list.html'
    };
  }
})();
