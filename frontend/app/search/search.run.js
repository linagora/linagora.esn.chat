(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  runBlock.$inject = ['searchProviders', 'chatSearchMessagesProviderService'];

  function runBlock(searchProviders, chatSearchMessagesProviderService) {
    searchProviders.add(chatSearchMessagesProviderService);
  }

})();
