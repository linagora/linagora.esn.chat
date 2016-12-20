(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatSystemMessageController', chatMessageController);

    function chatMessageController($filter, chatParseMention) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        self.systemUser = {
          displayName: 'System',
          avatarUrl: '/chat/images/system-user.png'
        };
        var parsedText = $filter('oembedImageFilter')(self.message.text);

        parsedText = $filter('linky')(parsedText, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        parsedText = chatParseMention.parseMentions(parsedText, self.message.user_mentions);
        self.parsed = {
          text: parsedText
        };
      }
    }
})();
