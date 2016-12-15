(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatNotificationService, chatMessageService, chatLocalStateService, editableOptions) {
    chatLocalStateService.initLocalState();
    chatMessageService.connect();
    chatNotificationService.start();
    editableOptions.theme = 'bs3';
  }

})();
