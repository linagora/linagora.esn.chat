(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .factory('chatParseMention', chatParseMention);

  function chatParseMention() {
    return function(text, mentions, options) {
      options = options || {};

      function generateDisplayName(user) {
        return '@' + user.firstname + '.' + user.lastname;
      }

      function generateProfileLink(user) {
        return '<a href="#/profile/' + user._id + '/details/view">' + generateDisplayName(user) + '</a>';
      }

      var replace = options.skipLink ? generateDisplayName : generateProfileLink;

      return (mentions || []).reduce(function(prev, user) {
        return prev.replace(new RegExp('@' + user._id, 'g'), replace(user));
      }, text);
    };
  }
})();
