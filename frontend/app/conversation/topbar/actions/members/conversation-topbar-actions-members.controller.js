(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarActionsMembers', ChatConversationTopbarActionsMembers);

  function ChatConversationTopbarActionsMembers($state) {
    var self = this;

    self.toggleDisplay = toggleDisplay;

    function toggleDisplay() {
      if ($state.includes('chat.channels-views.members')) {
        $state.go('chat.channels-views');
      } else {
        $state.go('chat.channels-views.members', {id: self.conversation._id});
      }
    }
  }
})();
