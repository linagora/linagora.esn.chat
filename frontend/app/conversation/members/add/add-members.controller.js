(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatMemberAddController', ChatMemberAddController);

  function ChatMemberAddController($stateParams, CHAT) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if ($stateParams.conversation) {
        self.conversation = $stateParams.conversation;
        self.objectType = self.conversation.objectType;
        self.options = {
          limit: CHAT.DEFAULT_FETCH_SIZE
        };
      }
    }
  }
})();
