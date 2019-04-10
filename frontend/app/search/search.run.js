(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(searchProviders, chatSearchProviderService, chatConfiguration) {
    chatConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      searchProviders.add(chatSearchProviderService);
    });
  }
})();
