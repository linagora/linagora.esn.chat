(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .service('chatSearchConversationsService', chatSearchConversationsService);

  function chatSearchConversationsService(ELEMENTS_PER_REQUEST, ChatRestangular) {
    var type = 'chat.conversation';

    return {
      buildFetcher: buildFetcher
    };

    ////////////

    function buildFetcher(query) {
      var offset = 0;

      return function() {
        return _searchConversations(query, {
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

    function _searchConversations(term, options) {
      options = angular.extend({search: term}, options);

      return ChatRestangular.all('conversations').getList(options);
    }
  }
})();
