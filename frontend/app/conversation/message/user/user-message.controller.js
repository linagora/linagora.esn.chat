(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatUserMessageController', chatUserMessageController);

    function chatUserMessageController($filter, $log, chatParseMention, session, userUtils, chatUsername, chatMessageStarService) {
      var self = this;

      self.displayFile = true;
      self.toggleFile = toggleFile;
      self.$onInit = $onInit;
      self.toggleStar = toggleStar;

      function sessionReady(session) {
        self.user = session.user;
      }

      function toggleFile() {
        self.displayFile = !self.displayFile;
      }

      function toggleStar() {
        (self.message.isStarred ? chatMessageStarService.unstar : chatMessageStarService.star)(self.message._id).then(function() {
          self.message.isStarred = !self.message.isStarred;
        }).catch(function(err) {
          $log.error('Error while toggling star of message', err);
        });
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
        chatParseMention.parseMentions(parsedText, self.message.user_mentions).then(function(result) {
          self.parsed = {
            text: result
          };
        });
        chatUsername.getFromCache(self.message.creator._id, false).then(function(creator) {
          self.displayName = creator;
        });
      }
    }
})();
