(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUsername', chatUsername);

    function chatUsername(userUtils, CHAT_MENTION_CHAR) {

      return {
        generate: generate,
        generateMention: generateMention
      };

      function generate(user) {
        return userUtils.displayNameOf(user);
      }

      function generateMention(user) {
        return CHAT_MENTION_CHAR + generate(user);
      }
    }
})();
