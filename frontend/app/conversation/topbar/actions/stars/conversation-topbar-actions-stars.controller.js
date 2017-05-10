(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarActionsStars', ChatConversationTopbarActionsStars);

  function ChatConversationTopbarActionsStars($state) {
    var self = this;

    self.toggleDisplay = toggleDisplay;

    function toggleDisplay() {
      if ($state.includes('chat.channels-views.stars')) {
        $state.go('chat.channels-views');
      } else {
        $state.go('chat.channels-views.stars', {id: self.conversation._id});
      }
    }
  }
})();
