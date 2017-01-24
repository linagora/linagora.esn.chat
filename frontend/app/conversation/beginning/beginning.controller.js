(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationBeginningController', ChatConversationBeginningController);

    function ChatConversationBeginningController(chatConversationNameService) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        chatConversationNameService.getName(self.conversation).then(function(name) {
          self.name = name;
        });
      }
    }

})();
