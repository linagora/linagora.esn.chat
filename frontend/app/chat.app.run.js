(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatNotificationService, chatMessageService, chatConversationActionsService, chatConversationListenerService, editableOptions) {
    chatMessageService.connect();
    chatNotificationService.start();
    chatConversationActionsService.start();
    chatConversationListenerService.start();
    editableOptions.theme = 'bs3';
  }

})();
