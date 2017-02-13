(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatNotificationService, chatConversationActionsService, chatConversationListenerService, editableOptions) {
    chatNotificationService.start();
    chatConversationActionsService.start();
    chatConversationListenerService.start();
    editableOptions.theme = 'bs3';
  }

})();
