(function() {
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
        templateUrl: '/chat/app/conversation/message/message.html',
        controller: chatMessageController,
        controllerAs: 'vm',
        bindToController: true
      };

      return directive;
    }

    chatMessageController.$inject = ['$filter', '$timeout', 'chatParseMention', 'session', 'chatScrollService', 'chatConversationsService'];

    function chatMessageController($filter, $timeout, chatParseMention, session, chatScrollService, chatConversationsService) {
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

      chatConversationsService.getConversationNamePromise.then(setConversationName);
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
