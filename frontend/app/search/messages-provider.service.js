(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchMessagesProviderService', chatSearchMessagesProviderService);

  function chatSearchMessagesProviderService($q, newProvider, chatSearchMessageService, CHAT, chatParseMention) {
    var name = 'Chat Messages';
    var type = 'chat.message';

    return newProvider({
      name: name,
      fetch: function(query) {
        var offset = 0;

        return function() {
          return chatSearchMessageService.searchMessages(query, {
            offset: offset,
            limit: CHAT.DEFAULT_FETCH_SIZE
          }).then(function(response) {
            offset += response.data.length;

            return response.data.map(function(message) {
              message.type = type;
              message.text = chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true});

              return message;
            });
          });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query);
      },
      templateUrl: '/chat/app/search/messages-search-item.html'
    });
  }

})();
