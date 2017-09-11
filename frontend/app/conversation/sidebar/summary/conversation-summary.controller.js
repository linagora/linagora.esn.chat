(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatConversationSidebarSummaryController', chatConversationSidebarSummaryController);

  function chatConversationSidebarSummaryController(chatConversationsStoreService, chatConversationService, CHAT_CONVERSATION_TYPE) {
    var self = this;

    self.conversation = chatConversationsStoreService.activeRoom;
    self.$onInit = $onInit;

    function $onInit() {
      self.isPublicConversation = self.conversation.type === CHAT_CONVERSATION_TYPE.OPEN;
      getSummary();
    }

    function getSummary() {
      chatConversationService.getSummary(self.conversation._id).then(function(summary) {
        self.summary = summary;
      });
    }
  }
})();
