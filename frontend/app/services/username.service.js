(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUsername', chatUsername);

    function chatUsername(Cache, userAPI, userUtils, CHAT_MENTION_CHAR) {

      var cache = new Cache({
        loader: _userNameLoader
      });

      return {
        generate: generate,
        generateMention: generateMention,
        getFromCache: getFromCache
      };

      function _userNameLoader(userId) {
        return userAPI.user(userId).then(function(response) {
          return generateMention(response.data);
        });
      }

      function generate(user) {
        return userUtils.displayNameOf(user);
      }

      function generateMention(user) {
        return CHAT_MENTION_CHAR + generate(user);
      }

      function getFromCache(userId) {
        return cache.get(userId);
      }
    }
})();
