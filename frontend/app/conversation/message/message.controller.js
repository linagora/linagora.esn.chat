(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatMessageController', chatMessageController);

    function chatMessageController(_, CHAT_MESSAGE_DISPLAYABLE_TYPES, CHAT_SYSTEM_MESSAGE_SUBTYPES) {
      var self = this;

      self.CHAT_MESSAGE_DISPLAYABLE_TYPES = CHAT_MESSAGE_DISPLAYABLE_TYPES;
      self.$onInit = $onInit;

      function $onInit() {
        self.displayType = self.message.subtype && _.include(CHAT_SYSTEM_MESSAGE_SUBTYPES, self.message.subtype) ?
          CHAT_MESSAGE_DISPLAYABLE_TYPES.SYSTEM : CHAT_MESSAGE_DISPLAYABLE_TYPES.USER;
      }
    }
})();
