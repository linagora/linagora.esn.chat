(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatParseMention', chatParseMention);

    function chatParseMention($q, chatUsername, CHAT_MENTION_CHAR) {
      var service = {
        parseMentions: parseMentions,
        generateProfileLink: generateProfileLink,
        userIsMentioned: userIsMentioned
      };

      return service;

      ////////////

      function generateProfileLink(userId, prependUserWithArobase) {
        return chatUsername.getFromCache(userId, prependUserWithArobase).then(function(result) {
          return '<a href="#/profile/' + userId + '/details/view">' + result + '</a>';
        });
      }

      function parseMentions(text, mentions, options) {
        options = options || {};
        var replace = options.skipLink ? chatUsername.getFromCache : generateProfileLink;

        if (!mentions[0]) {
          return $q.when(text);
        }

        return mentions.reduce(function(prev, user) {
          return replace(user._id, true).then(function(result) {
            if (typeof (prev) === 'string') { //prev will be a string or a promise
              return prev.replace(new RegExp(CHAT_MENTION_CHAR + user._id, 'g'), result);
            }

            return prev.then(function(res) {
              return res.replace(new RegExp(CHAT_MENTION_CHAR + user._id, 'g'), result);
            });
          });
        }, text);
      }

      function userIsMentioned(text, user) {
        return new RegExp(CHAT_MENTION_CHAR + user._id, 'g').exec(text);
      }
    }
})();
