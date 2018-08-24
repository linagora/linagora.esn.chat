(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchProviderService', chatSearchProviderService);

  function chatSearchProviderService(
    $q,
    _,
    esnSearchProvider,
    chatSearchConversationsService,
    chatSearchMessagesService
  ) {

    var searchServices = [chatSearchConversationsService, chatSearchMessagesService];

    return new esnSearchProvider({
      uid: 'op.chat',
      name: 'Chat',
      fetch: function(query) {

        return function() {
          return $q.all(searchServices
            .map(function(service) { return service.buildFetcher(query); })
            .map(function(fetcher) { return fetcher(); })
          )
            .then(function(results) { return _.flatten(results); });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query && options.query.text);
      },
      templateUrl: '/chat/app/search/chat-search-item.html',
      activeOn: ['chat']
    });
  }

})();
