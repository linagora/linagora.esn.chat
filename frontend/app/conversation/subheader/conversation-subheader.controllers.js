(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  ChatConversationSubheaderController.$inject = ['$scope', 'chatLocalStateService', 'chatConversationsService'];

  function ChatConversationSubheaderController($scope, chatLocalStateService, chatConversationsService) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.$onInit = $onInit;

    function $onInit() {
      chatConversationsService.getConversationNamePromise.then(function(getConversationName) {
        self.getConversationName = getConversationName;
      });
    }
  }
})();
