(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationNameService', chatConversationNameService);

    function chatConversationNameService(session, _, userUtils) {

      return {
        getName: getName
      };

      function getName(conversation, options) {
        var currentUserId = session.user._id;

        function userToString(user) {
          return options && options.onlyFirstName ? user.firstname : userUtils.displayNameOf(user);
        }

        if (!conversation || (!conversation.name && !conversation.members)) {
          return;
        }

        if (conversation.name) {
          return conversation.name;
        }

        if (conversation.members.length === 1) {
          return userToString(conversation.members[0]);
        }

        return _.chain(conversation.members)
          .reject({_id: currentUserId})
          .map(userToString)
          .value()
          .join(', ');
      }
    }
})();
