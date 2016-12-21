(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  function ChatConversationSubheaderController($scope, chatLocalStateService, chatConversationNameService) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.getConversationName = getConversationName;

    function getConversationName(conversation) {
      return chatConversationNameService.getName(conversation);
    }
  }
})();
