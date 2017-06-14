(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatSystemMessageController', chatMessageController);

    function chatMessageController($filter, chatParseMention, $translate) {
      var self = this;
      var parsedText;

      self.$onInit = $onInit;

      function $onInit() {
        self.systemUser = {
          displayName: 'System',
          avatarUrl: '/chat/images/system-user.png'
        };

        parsedText = translateMessage(self.message.text);
        parsedText = $filter('oembedImageFilter')(parsedText);
        parsedText = $filter('linky')(parsedText, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        chatParseMention.parseMentions(parsedText, self.message.user_mentions).then(function(result) {
          parsedText = result;
          self.parsed = {
            text: parsedText
          };
        });
      }

      function translateMessage(message) {
        var params = [];

        message = message.replace(/<%(.*?)%>/g, function(match, submatch) {
          params.push(submatch);

          return '%s';
        });

        return $translate.instant(message, params);
      }
    }
})();
