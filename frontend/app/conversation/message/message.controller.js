(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatMessageController', chatMessageController);

    function chatMessageController(_, CHAT_MESSAGE_DISPLAYABLE_TYPES, CHAT_SYSTEM_MESSAGE_SUBTYPES) {
      var self = this;

      self.CHAT_MESSAGE_DISPLAYABLE_TYPES = CHAT_MESSAGE_DISPLAYABLE_TYPES;
      self.$onInit = $onInit;

      function $onInit() {
        if (self.message.type) {
          self.displayType = CHAT_MESSAGE_DISPLAYABLE_TYPES.USER;

          if (self.message.type === CHAT_MESSAGE_DISPLAYABLE_TYPES.BOT) {
            self.displayType = CHAT_MESSAGE_DISPLAYABLE_TYPES.BOT;
          } else if (self.message.subtype && _.include(CHAT_SYSTEM_MESSAGE_SUBTYPES, self.message.subtype)) {
            self.displayType = CHAT_MESSAGE_DISPLAYABLE_TYPES.SYSTEM;
          }
        }
      }
    }
})();
