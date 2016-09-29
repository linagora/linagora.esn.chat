(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatMessage', chatMessageDirective);

    function chatMessageDirective() {
      var directive = {
        restrict: 'E',
        scope: {
          message: '='
        },
        templateUrl: '/chat/views/components/conversation-view/messages/message.html',
        controller: chatMessageController,
        bindToController: true
      };

      return directive;
    }

    chatMessageController.$inject = ['$filter', '$timeout', 'chatParseMention', 'session', 'chatScrollService', 'conversationsService'];

    function chatMessageController($filter, $timeout, chatParseMention, session, chatScrollService, conversationsService) {
      var self = this;
      var parsedText = $filter('oembedImageFilter')(self.message.text);

      self.displayFile = true;
      self.toggleFile = toggleFile;

      parsedText = $filter('linky')(parsedText, '_blank');
      parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
      parsedText = chatParseMention.chatParseMention(parsedText, self.message.user_mentions);
      self.parsed = {
        text: parsedText
      };

      conversationsService.getConversationNamePromise.then(setConversationName);
      session.ready.then(sessionReady);

      ////////////

      function toggleFile() {
        self.displayFile = !self.displayFile;
      }

      function sessionReady(session) {
        self.user = session.user;
        $timeout(function() {
          chatScrollService.scrollDown();
        });
      }

      function setConversationName(getConversationName) {
        self.getConversationName = getConversationName;
      }
    }
})();
