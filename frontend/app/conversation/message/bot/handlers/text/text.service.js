(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatBotMessageTextHandler', chatBotMessageTextHandler);

  function chatBotMessageTextHandler($q, $filter, CHAT_BOT) {
    var type = CHAT_BOT.MESSAGE_SUBTYPES.TEXT;

    var service = {
      type: type,
      setText: setText
    };

    return service;

    function setText(message) {
      var parsedText = $filter('oembedImageFilter')(message.text);

      parsedText = $filter('linky')(parsedText, '_blank');
      parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});

      return $q.when(parsedText);
    }
  }
})();
