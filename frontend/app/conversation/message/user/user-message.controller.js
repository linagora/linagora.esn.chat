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

      function splitMentions(text) {
        return text.replace(/@/g, ' @').replace(/^ @/, '@').replace(/ {2}@/g, ' @');
      }

      function $onInit() {
        var parsedText = $filter('oembedImageFilter')(self.message.text);

        if (self.message.user_mentions.length > 0) {
          parsedText = splitMentions(parsedText);
        }
        session.ready.then(sessionReady);

        parsedText = $filter('linky')(parsedText, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        parsedText = chatParseMention.parseMentions(parsedText, self.message.user_mentions);
        self.parsed = {
          text: parsedText
        };
      }
    }
})();
