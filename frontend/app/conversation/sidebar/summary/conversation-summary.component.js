  (function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarSummary', chatConversationSidebarSummary());

  function chatConversationSidebarSummary() {
    return {
      controller: 'chatConversationSidebarSummaryController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/summary/conversation-summary.html'
    };
  }
})();
