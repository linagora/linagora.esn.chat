(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatSummaryAttachments', chatSummaryAttachments());

  function chatSummaryAttachments() {
    return {
      bindings: {
        conversation: '<',
        attachments: '<'
      },
      controller: 'chatSummaryAttachmentsController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/summary/chat-summary-attachments/chat-summary-attachments.html'
    };
  }
})();
