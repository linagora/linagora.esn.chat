(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatMemberAddController', ChatMemberAddController);

  function ChatMemberAddController($stateParams, CHAT, ELEMENTS_PER_REQUEST) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if ($stateParams.conversation) {
        self.conversation = $stateParams.conversation;
        self.objectType = self.conversation.objectType;
        self.options = {
          limit: ELEMENTS_PER_REQUEST || CHAT.DEFAULT_FETCH_SIZE,
          offset: CHAT.DEFAULT_FETCH_OFFSET
        };
      }
    }
  }
})();
