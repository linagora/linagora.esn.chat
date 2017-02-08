(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopicEditionController', ChatConversationTopicEditionController);

  function ChatConversationTopicEditionController(chatConversationActionsService) {
    var self = this;

    self.updateTopic = updateTopic;

    function updateTopic(topic) {
      chatConversationActionsService.updateConversationTopic(self.conversation, topic);
    }
  }
})();
