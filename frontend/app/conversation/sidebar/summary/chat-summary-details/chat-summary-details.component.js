(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatSummaryDetails', chatSummaryDetail());

  function chatSummaryDetail() {
    return {
      bindings: {
        conversation: '<',
        topic: '<',
        purpose: '<',
        creator: '<',
        creationDate: '<'
      },
      controller: 'chatSummaryDetailsController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/summary/chat-summary-details/chat-summary-details.html'
    };
  }
})();
