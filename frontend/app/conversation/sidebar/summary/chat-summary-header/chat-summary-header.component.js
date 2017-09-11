(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatSummaryHeader', chatSummaryHeader());

  function chatSummaryHeader() {
    return {
      bindings: {
        isPublicConversation: '<',
        name: '<'
      },
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/summary/chat-summary-header/chat-summary-header.html'
    };
  }
})();
