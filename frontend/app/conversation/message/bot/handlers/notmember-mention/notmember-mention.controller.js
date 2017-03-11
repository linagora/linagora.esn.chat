(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatBotMessageNotMemberMentionController', chatBotMessageNotMemberMentionController);

    function chatBotMessageNotMemberMentionController($q, $log, chatBotMessageService, chatConversationActionsService) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        self.addMembers = addMembers;
      }

      function addMemberToConversation(user) {
        return chatConversationActionsService.addMember(self.conversationId, user._id);
      }

      function addMembers() {
        if (!Array.isArray(self.userMentions)) {
          self.userMentions = [self.userMentions];
        }

        self.userMentions.map(addMemberToConversation);
      }
    }
})();
