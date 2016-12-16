(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatMessageController', chatMessageController);

    function chatMessageController($filter, $timeout, chatParseMention, session, chatScrollService, chatConversationsService) {
      var self = this;

      self.displayFile = true;
      self.toggleFile = toggleFile;
      self.$onInit = $onInit;

      function sessionReady(session) {
        self.user = session.user;
      }

      function setConversationName(getConversationName) {
        self.getConversationName = getConversationName;
      }

      function toggleFile() {
        self.displayFile = !self.displayFile;
      }

      function $onInit() {
        var parsedText = $filter('oembedImageFilter')(self.message.text);

        session.ready.then(sessionReady);
        chatConversationsService.getConversationNamePromise.then(setConversationName);

        parsedText = $filter('linky')(parsedText, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        parsedText = chatParseMention.chatParseMention(parsedText, self.message.user_mentions);
        self.parsed = {
          text: parsedText
        };
      }
    }
})();
