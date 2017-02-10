(function() {
  'use strict';

  angular.module('linagora.esn.chat').run(websocketRunBlock);

  function websocketRunBlock($log, $rootScope, chatWebsocketMessengerService, chatMessageReceiverService, session, CHAT_WEBSOCKET_EVENTS) {
    session.ready.then(function() {
      var messenger = chatWebsocketMessengerService.get();

      messenger.addEventListener(CHAT_WEBSOCKET_EVENTS.MESSAGE, chatMessageReceiverService.onMessage);

      messenger.connect();
    });
  }
})();
