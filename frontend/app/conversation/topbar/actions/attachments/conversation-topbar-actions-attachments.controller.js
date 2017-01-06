(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarActionsAttachments', ChatConversationTopbarActionsAttachments);

  function ChatConversationTopbarActionsAttachments($state) {
    var self = this;

    self.toggleDisplay = toggleDisplay;

    function toggleDisplay() {
      if ($state.includes('chat.channels-views.attachments')) {
        $state.go('chat.channels-views');
      } else {
        $state.go('chat.channels-views.attachments', {id: self.conversation._id});
      }
    }
  }
})();
