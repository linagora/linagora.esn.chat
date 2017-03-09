(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatUserTypingController', ChatUserTypingController);

    function ChatUserTypingController($scope, _, session, userUtils, chatConversationsStoreService, CHAT_MESSAGE_TYPE) {
      var self = this;

      self.typing = {};
      self.$onInit = $onInit;

      function $onInit() {
        var userTyping = $scope.$on('chat:message:' + CHAT_MESSAGE_TYPE.USER_TYPING, onUserTyping);

        $scope.$on('$destroy', function() {
          userTyping();
        });
      }

      function onUserTyping(evt, message) {
        self.typing[message.creator._id] = message;

        self.usersTyping = _.chain(self.typing)
          .filter(function(message) {
            return message.state && chatConversationsStoreService.activeRoom._id === message.channel && message.creator._id !== session.user._id;
          })
          .map('creator')
          .map(userUtils.displayNameOf)
          .value();
      }
    }
})();
