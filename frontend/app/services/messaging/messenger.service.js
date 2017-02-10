(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessengerService', chatMessengerService);

  function chatMessengerService(chatWebsocketMessengerService) {
    return chatWebsocketMessengerService.get();
  }
})();
