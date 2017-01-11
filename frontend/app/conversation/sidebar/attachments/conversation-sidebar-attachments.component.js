(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarAttachments', chatConversationSidebarAttachments());

  function chatConversationSidebarAttachments() {
    return {
      controller: 'ChatConversationSidebarAttachmentsController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/attachments/conversation-sidebar-attachments.html'
    };
  }
})();
