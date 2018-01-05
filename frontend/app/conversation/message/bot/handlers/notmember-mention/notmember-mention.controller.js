(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatBotMessageNotMemberMentionController', chatBotMessageNotMemberMentionController);

    function chatBotMessageNotMemberMentionController($q, $log, $state, chatBotMessageService, chatConversationActionsService, chatConversationService, CHAT_CONVERSATION_TYPE) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        self.addMembers = addMembers;
        getConversation();
      }

      function addMemberToConversation(user) {
        return chatConversationActionsService.addMember(self.conversationId, user._id);
      }

      function addMembers() {
        if (!Array.isArray(self.userMentions)) {
          self.userMentions = [self.userMentions];
        }

        if (self.isPublicConversation) {
          self.userMentions.map(addMemberToConversation);
        } else {
          var totalMembers = self.conversation.members.concat(self.userMentions.map(function(userMention) {

            return {member: {id: userMention._id, objectType: 'user'}};
          })).map(function(member) {

            return member.member.id;
          });

          chatConversationActionsService.createDirectmessageConversation({members: totalMembers})
            .then(function(conversation) {

              $state.go('chat.channels-views', {id: conversation._id});
            })
            .catch(function(err) {
              $log.error('Could not create conversation with members', totalMembers, err);
            });
        }
      }

      function getConversation() {
        chatConversationService.get(self.conversationId).then(function(conversation) {
          self.conversation = conversation;
          self.isPublicConversation = self.conversation.type === CHAT_CONVERSATION_TYPE.OPEN;
        });
      }
    }
})();
