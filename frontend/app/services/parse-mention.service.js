(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatParseMention', chatParseMention);

    function chatParseMention(chatUsername, CHAT_MENTION_CHAR) {
      var service = {
        parseMentions: parseMentions,
        generateProfileLink: generateProfileLink,
        userIsMentioned: userIsMentioned
      };

      return service;

      ////////////

      function generateProfileLink(user) {
        return '<a href="#/profile/' + user._id + '/details/view">' + chatUsername.generateMention(user) + '</a>';
      }

      function parseMentions(text, mentions, options) {
        options = options || {};
        var replace = options.skipLink ? chatUsername.generateMention : generateProfileLink;

        return (mentions || []).reduce(function(prev, user) {
          return prev.replace(new RegExp(CHAT_MENTION_CHAR + user._id, 'g'), replace(user));
        }, text);
      }

      function userIsMentioned(text, user) {
        return new RegExp(CHAT_MENTION_CHAR + user._id, 'g').exec(text);
      }
    }
})();
