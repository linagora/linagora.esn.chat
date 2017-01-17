(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(searchProviders, chatSearchConversationsProviderService, chatSearchMessagesProviderService) {
    searchProviders.add(chatSearchConversationsProviderService);
    searchProviders.add(chatSearchMessagesProviderService);
  }

})();
