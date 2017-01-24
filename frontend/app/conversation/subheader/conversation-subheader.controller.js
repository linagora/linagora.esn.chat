(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  function ChatConversationSubheaderController($stateParams, $scope, chatLocalStateService, chatConversationNameService) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.$onInit = $onInit;

    function $onInit() {
      chatConversationNameService.getName(chatLocalStateService.findConversation($stateParams.id)).then(function(name) {
        self.name = name;
      });
    }
  }
})();
