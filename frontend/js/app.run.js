'use strict';

angular.module('linagora.esn.chat')
.run(function(chatNotification, chatMessageService, chatLocalStateService, editableOptions) {
  chatLocalStateService.initLocalState();
  chatMessageService.connect();
  chatNotification.start();
  editableOptions.theme = 'bs3';
});
