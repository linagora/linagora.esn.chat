(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatUserTypingController', ChatUserTypingController);

    function ChatUserTypingController($q, $scope, _, session, chatUsername, chatConversationMemberService, chatConversationsStoreService, CHAT_MESSAGE_TYPE) {
      var self = this;

      self.typing = {};
      self.$onInit = $onInit;

      function $onInit() {
        $scope.$on('chat:message:' + CHAT_MESSAGE_TYPE.USER_TYPING, onUserTyping);
      }

      function onUserTyping(evt, message) {
        if (!message || !message.creator || !message.creator._id || !chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom)) {
          return;
        }

        self.typing[message.creator._id] = message;

        var usersTyping = _.chain(self.typing)
          .filter(function(message) {
            return message.state && chatConversationsStoreService.activeRoom._id === message.channel && message.creator._id !== session.user._id;
          })
          .map('creator')
          .value();

        $q.all(usersTyping.map(function(user) {

          return chatUsername.getFromCache(user._id, false);
        })).then(function(usersName) {
          self.usersTyping = usersName;
        });
      }
    }
})();
