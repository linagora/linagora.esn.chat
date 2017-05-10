(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSidebarAttachmentsList', chatConversationSidebarAttachmentsList());

  function chatConversationSidebarAttachmentsList() {
    return {
      controller: 'ChatConversationSidebarAttachmentsListController',
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/sidebar/attachments/conversation-sidebar-attachments-list.html'
    };
  }
})();
