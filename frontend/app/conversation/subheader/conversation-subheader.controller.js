(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  function ChatConversationSubheaderController($stateParams, chatConversationsStoreService, chatConversationNameService) {
    var self = this;

    self.chatConversationsStoreService = chatConversationsStoreService;
    self.$onInit = $onInit;

    function $onInit() {
      chatConversationNameService.getName(chatConversationsStoreService.findConversation($stateParams.id)).then(function(name) {
        self.name = name;
      });
    }
  }
})();
