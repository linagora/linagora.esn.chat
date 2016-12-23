(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarController', ChatConversationTopbarController);

  function ChatConversationTopbarController(chatConversationsService) {
    var self = this;

    self.updateTopic = updateTopic;

    function updateTopic(topic) {
      chatConversationsService.updateConversationTopic(topic, self.conversation._id);
    }
  }
})();
