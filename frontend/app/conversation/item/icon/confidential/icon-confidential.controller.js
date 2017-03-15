(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationItemIconConfidentialController', ChatConversationItemIconConfidentialController);

    function ChatConversationItemIconConfidentialController() {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        setIcon();
      }

      function setIcon() {
        self.icon = self.conversation.members_count > 10 ? 'mdi-numeric-9-plus-box' : 'mdi-numeric-' + (self.conversation.members_count - 1) + '-box';
      }
    }
})();
