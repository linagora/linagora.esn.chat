(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .factory('chatParseMention', chatParseMention);

  function chatParseMention(userAPI, $q, _) {
    var cacheUser = {};

    return function(text, metaData) {
      var result = text;
      var allMentions = _.uniq(text.match(/@[a-f0-9]+/g) || []);

      var mentionsWithUsers = allMentions.map(function(mention) {
        return resolveUser(mention.replace(/^@/, '')).then(function(response) {
          return {
            user: response,
            mention: mention
          };
        });
      });

      return $q.all(mentionsWithUsers).then(function(mentionsWithUsers) {
        mentionsWithUsers.map(function(mentionWithUser) {
          var user = mentionWithUser.user;
          result = result.replace(new RegExp(mentionWithUser.mention, 'g'), '<a href="#/profile/' + user._id + '/details/view">@' + user.firstname + '.' + user.lastname + '</a>');
        });

        return result;
      });

      function resolveUser(id) {
        if (cacheUser[id]) {
          return $q.when(cacheUser[id]);
        }

        return userAPI.user(id).then(function(response) {
          cacheUser[id] = response.data;

          return response.data;
        });
      }
    };
  }
})();
