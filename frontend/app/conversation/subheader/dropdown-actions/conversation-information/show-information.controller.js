(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatShowInformationDropdownActionController', ChatShowInformationDropdownActionController);

  function ChatShowInformationDropdownActionController($state, chatConversationsStoreService) {
    var self = this;

    self.toggleDisplay = toggleDisplay;
    self.informationShown = $state.includes('chat.channels-views.summary');
    function toggleDisplay() {
      if ($state.includes('chat.channels-views.summary')) {
        self.informationShown = false;
        $state.go('chat.channels-views');
      } else {
        self.informationShown = true;
        $state.go('chat.channels-views.summary', {id: chatConversationsStoreService.activeRoom._id});
      }
    }
  }
})();
