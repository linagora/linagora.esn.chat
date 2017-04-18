(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchConversationsProviderService', chatSearchConversationsProviderService);

  ////////////

  function chatSearchConversationsProviderService($q, $filter, newProvider, chatSearchConversationService, ELEMENTS_PER_REQUEST) {
    var name = 'Chat channel details';
    var type = 'chat.conversation';

    return newProvider({
      name: name,
      fetch: function(query) {
        var offset = 0;

        return function() {
          return chatSearchConversationService.searchConversations(query, {
            offset: offset,
            limit: ELEMENTS_PER_REQUEST
          }).then(function(response) {
            offset += response.data.length;

            return response.data.map(function(conversation) {
              conversation.type = type;

              return conversation;
            });
          });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query);
      },
      templateUrl: '/chat/app/search/conversations/conversations-search-item.html'
    });
  }

})();
