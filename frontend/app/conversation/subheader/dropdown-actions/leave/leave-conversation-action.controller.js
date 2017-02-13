(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatLeaveConversationDropdownActionController', ChatLeaveConversationDropdownActionController);

  function ChatLeaveConversationDropdownActionController($state, chatConversationsStoreService, chatConversationActionsService) {
    this.leaveConversation = leaveConversation;

    function leaveConversation() {
      chatConversationActionsService.leaveConversation(chatConversationsStoreService.activeRoom);
      $state.go('chat.channels-views', {id: chatConversationsStoreService.channels[0]._id});
    }

  }
})();
