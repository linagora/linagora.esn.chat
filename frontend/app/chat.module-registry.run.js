(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat').run(runBlock);

  function runBlock(
    esnModuleRegistry,
    CHAT_MODULE_METADATA
  ) {
    esnModuleRegistry.add(CHAT_MODULE_METADATA);
  }
})(angular);
