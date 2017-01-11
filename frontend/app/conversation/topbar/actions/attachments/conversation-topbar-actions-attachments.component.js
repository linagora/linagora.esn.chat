(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationTopbarActionsAttachments', chatConversationTopbarActionsAttachments());

  function chatConversationTopbarActionsAttachments() {

    return {
      controller: 'ChatConversationTopbarActionsAttachments',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/topbar/actions/attachments/conversation-topbar-actions-attachments.html',
      bindings: {
        conversation: '<'
      }
    };
  }
})();
