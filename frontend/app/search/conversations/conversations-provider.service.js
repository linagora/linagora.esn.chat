(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchConversationsProviderService', chatSearchConversationsProviderService);

  ////////////

  function chatSearchConversationsProviderService($q, $filter, newProvider, chatSearchConversationService, ELEMENTS_PER_REQUEST) {
    var name = 'Chat Conversations';
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
              conversation = conversation._source;
              conversation.type = type;
              conversation.topic.value = $filter('linky')(conversation.topic.value, '_blank');
              conversation.purpose.value = $filter('linky')(conversation.purpose.value, '_blank');
              conversation.name = $filter('linky')(conversation.name, '_blank');

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
