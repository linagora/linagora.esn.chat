(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopicEditionController', ChatConversationTopicEditionController);

  function ChatConversationTopicEditionController(chatConversationActionsService) {
    var self = this;

    self.updateTopic = updateTopic;
    self.draft = draft;
    self.$onInit = $onInit;

    function $onInit() {
      self.topic = self.conversation.topic.value;
    }

    function updateTopic(topic) {
      chatConversationActionsService.updateConversationTopic(self.conversation, topic);
    }

    function draft(unsavedTopic) {
      self.topic = unsavedTopic;
    }
  }
})();
