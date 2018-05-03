(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .service('chatSearchConversationsService', chatSearchConversationsService);

  function chatSearchConversationsService(ELEMENTS_PER_REQUEST, ChatRestangular) {
    var type = 'chat.conversation';

    return {
      buildFetcher: buildFetcher,
      searchConversations: searchConversations
    };

    ////////////

    function buildFetcher(query) {
      var offset = 0;

      return function() {
        return searchConversations(query, {
          offset: offset,
          limit: ELEMENTS_PER_REQUEST
        }).then(function(response) {
          offset += response.data.length;

          return response.data.map(function(conversation) {
            conversation.type = type;
            conversation.date = conversation.timestamps.creation;

            return conversation;
          });
        });
      };
    }

    function searchConversations(term, options) {
      options = angular.extend({search: term}, options);

      return ChatRestangular.all('conversations').getList(options);
    }
  }
})();
