(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  ChatConversationSubheaderController.$inject = ['$scope', 'chatLocalStateService', 'chatConversationsService'];

  function ChatConversationSubheaderController($scope, chatLocalStateService, chatConversationsService) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;

    activate();

    function activate() {
      chatConversationsService.getConversationNamePromise.then(function(getConversationName) {
        $scope.getConversationName = getConversationName;
      });
    }
  }
})();
