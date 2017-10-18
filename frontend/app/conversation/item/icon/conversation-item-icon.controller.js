(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationItemIconController', ChatConversationItemIconController);

    function ChatConversationItemIconController(CHAT_CONVERSATION_TYPE, CHAT_STATUS_ICON) {
      var self = this;

      self.$onInit = $onInit;

      function setIconType() {
        self.iconType = CHAT_STATUS_ICON.OPEN;

        if (self.conversation.type === CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE) {
          self.iconType = self.conversation.members_count === 2 ? CHAT_STATUS_ICON.DM : CHAT_STATUS_ICON.CONFIDENTIAL;
        }
      }

      function $onInit() {
        setIconType();
      }
    }
})();
