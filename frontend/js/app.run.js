'use strict';

angular.module('linagora.esn.chat')
.run(function(chatNotification, chatLocalStateService, editableOptions) {
  chatLocalStateService.initLocalState();
  chatNotification.start();
  editableOptions.theme = 'bs3';
});
