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
          return generate(response.data);
        });
      }

      function generate(user) {
        return userUtils.displayNameOf(user);
      }

      function generateMention(userName) {
        return CHAT_MENTION_CHAR + userName;
      }

      function getFromCache(userId, prependUserWithArobase) {
        if (prependUserWithArobase) {
          return cache.get(userId).then(function(userName) {
            return generateMention(userName);
          });
        }

        return cache.get(userId);
      }
    }
})();
