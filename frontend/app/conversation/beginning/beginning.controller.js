(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationBeginningController', ChatConversationBeginningController);

    function ChatConversationBeginningController(chatConversationNameService) {
      var self = this;

      self.name = chatConversationNameService.getName(self.conversation);
    }

})();
