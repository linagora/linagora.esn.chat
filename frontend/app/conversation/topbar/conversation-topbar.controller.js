(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarController', ChatConversationTopbarController);

  function ChatConversationTopbarController(chatConversationActionsService) {
    var self = this;

    self.updateTopic = updateTopic;

    function updateTopic(topic) {
      chatConversationActionsService.updateConversationTopic(self.conversation, topic);
    }
  }
})();
