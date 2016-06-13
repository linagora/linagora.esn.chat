'use strict';

angular.module('linagora.esn.chat')
.run(function(chatNotification, chatLocalStateService) {
  chatLocalStateService.initLocalState();
  chatNotification.start();
});
