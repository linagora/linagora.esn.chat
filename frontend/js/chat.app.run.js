(function() {
  'use strict';

  angular.module('linagora.esn.chat')
  .run(function(chatNotificationService, chatMessageService, chatLocalStateService, editableOptions) {
    chatLocalStateService.initLocalState();
    chatMessageService.connect();
    chatNotificationService.start();
    editableOptions.theme = 'bs3';
  });
})();
