(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatLaunchConversationController', ChatLaunchConversationController);

  function ChatLaunchConversationController(chatLaunchConversationService) {
    var self = this;

    self.launch = launch;

    function launch(onSuccess) {
      chatLaunchConversationService.launch(self.userId, onSuccess);
    }
  }
})();
