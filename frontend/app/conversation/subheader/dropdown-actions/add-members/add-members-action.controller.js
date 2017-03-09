(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatAddMembersDropdownActionController', ChatAddMembersDropdownActionController);

  function ChatAddMembersDropdownActionController($state, chatConversationsStoreService) {
    this.addMembers = addMembers;

    function addMembers() {
      $state.go('chat.channels-views.members-add', {conversation: chatConversationsStoreService.activeRoom});
    }

  }
})();
