(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .factory('chatParseMention', function() {

      function generateDisplayName(user) {
        return '@' + user.firstname + '.' + user.lastname;
      }

      function generateProfileLink(user) {
        return '<a href="#/profile/' + user._id + '/details/view">' + generateDisplayName(user) + '</a>';
      }

      function chatParseMention(text, mentions, options) {
        options = options || {};
        var replace = options.skipLink ? generateDisplayName : generateProfileLink;

        return (mentions || []).reduce(function(prev, user) {
          return prev.replace(new RegExp('@' + user._id, 'g'), replace(user));
        }, text);
      }

      function userIsMentioned(text, user) {
        return new RegExp('@' + user._id, 'g').exec(text);
      }

      return {
        chatParseMention: chatParseMention,
        generateDisplayName: generateDisplayName,
        generateProfileLink: generateProfileLink,
        userIsMentioned: userIsMentioned
      };
    });
})();
