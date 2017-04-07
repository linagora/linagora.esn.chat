(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationBeginningController', ChatConversationBeginningController);

    function ChatConversationBeginningController($q, chatConversationNameService, chatUsername, CHAT_CONVERSATION_TYPE) {
      var self = this;

      self.type = CHAT_CONVERSATION_TYPE;
      self.$onInit = $onInit;

      function $onInit() {
        chatConversationNameService.getName(self.conversation).then(function(name) {
          self.name = name;
        });

        chatUsername.getFromCache(self.conversation.creator, false).then(function(creator) {
          self.creator = creator;
        });

        if (self.conversation.type === CHAT_CONVERSATION_TYPE.CONFIDENTIAL) {
          self.members = [];
          $q.all(self.conversation.members.map(function(item) {
            return chatUsername.getFromCache(item.member.id, false).then(function(result) {
              self.members.push({id: item.member.id, memberName: result});
            });
          }));
        }
      }
    }
})();
