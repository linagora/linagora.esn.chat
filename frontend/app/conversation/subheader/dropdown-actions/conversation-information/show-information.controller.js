(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatShowInformationDropdownActionController', ChatShowInformationDropdownActionController);

  function ChatShowInformationDropdownActionController($state, chatConversationsStoreService) {
    var self = this;

    self.toggleDisplay = toggleDisplay;

    function toggleDisplay() {
      if ($state.includes('chat.channels-views.summary')) {
        $state.go('chat.channels-views');
      } else {
        $state.go('chat.channels-views.summary', {id: chatConversationsStoreService.activeRoom._id});
      }
    }
  }
})();
