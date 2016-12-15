(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(searchProviders, chatSearchMessagesProviderService) {
    searchProviders.add(chatSearchMessagesProviderService);
  }

})();
