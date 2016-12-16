(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatUserMessageController', chatUserMessageController);

    function chatUserMessageController($filter, chatParseMention, session) {
      var self = this;

      self.displayFile = true;
      self.toggleFile = toggleFile;
      self.$onInit = $onInit;

      function sessionReady(session) {
        self.user = session.user;
      }

      function toggleFile() {
        self.displayFile = !self.displayFile;
      }

      function $onInit() {
        var parsedText = $filter('oembedImageFilter')(self.message.text);

        session.ready.then(sessionReady);

        parsedText = $filter('linky')(parsedText, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        parsedText = chatParseMention.chatParseMention(parsedText, self.message.user_mentions);
        self.parsed = {
          text: parsedText
        };
      }
    }
})();
