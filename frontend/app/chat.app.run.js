(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatNotificationService, chatMessageService, chatConversationActionsService, editableOptions) {
    chatMessageService.connect();
    chatNotificationService.start();
    chatConversationActionsService.start();
    editableOptions.theme = 'bs3';
  }

})();
