(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationNameService', chatConversationNameService);

    function chatConversationNameService($q, session, _, chatUsername) {

      return {
        getName: getName
      };

      function getName(conversation) {

        if (!conversation || (!conversation.name && !conversation.members)) {
          return $q.when();
        }

        if (conversation.name) {
          return $q.when(conversation.name);
        }

        if (conversation.members.length === 1) {
          return chatUsername.getFromCache(conversation.members[0].member.id);
        }

        var otherUsers = _.reject(conversation.members, function(member) {
          return member.member.id === session.user._id;
        });

        return $q.all(otherUsers.map(function(member) {
          return chatUsername.getFromCache(member.member.id);
        })).then(function(results) {
          return results.join(', ');
        });
      }
    }
})();
