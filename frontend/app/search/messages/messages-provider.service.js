(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchMessagesProviderService', chatSearchMessagesProviderService);

  function chatSearchMessagesProviderService($q, $filter, newProvider, chatSearchMessageService, CHAT, chatParseMention) {
    var name = 'Chat Messages';
    var type = 'chat.message';

    return newProvider({
      name: name,
      fetch: function(query) {
        var offset = 0;

        return function() {
          var data = [];

          return chatSearchMessageService.searchMessages(query, {
            offset: offset,
            limit: CHAT.DEFAULT_FETCH_SIZE
          }).then(function(response) {
            offset += response.data.length;
            data = response.data;

            return $q.all(response.data.map(function(message) {
              return chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true});
            }));
          }).then(function(results) {
            return data.map(function(message, index) {
              message.type = type;
              message.text = $filter('linky')(message.text, '_blank');
              message.text = $filter('esnEmoticonify')(message.text, {class: 'chat-emoji'});
              message.text = results[index];

              return message;
            });
          });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query);
      },
      templateUrl: '/chat/app/search/messages/messages-search-item.html'
    });
  }

})();
