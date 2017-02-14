(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatWebsocketMessengerService', chatWebsocketMessengerService);

  function chatWebsocketMessengerService(ChatWebsocketTransportService, session, CHAT_WEBSOCKET_ROOM) {
    var chatWebsocketTransportInstance;

    return {
      get: get
    };

    function get() {
      if (chatWebsocketTransportInstance) {
        return chatWebsocketTransportInstance;
      }

      chatWebsocketTransportInstance = new ChatWebsocketTransportService({
        room: CHAT_WEBSOCKET_ROOM.DEFAULT,
        user: session.user._id
      });

      return chatWebsocketTransportInstance;
    }
  }
})();
