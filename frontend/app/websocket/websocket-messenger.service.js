(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatWebsocketMessengerService', chatWebsocketMessengerService);

  function chatWebsocketMessengerService(ChatWebsocketTransportService, session) {
    var chatWebsocketTransportInstance;

    return {
      get: get
    };

    function get() {
      if (chatWebsocketTransportInstance) {
        return chatWebsocketTransportInstance;
      }

      chatWebsocketTransportInstance = new ChatWebsocketTransportService({
        room: getRoom(),
        user: session.user._id
      });

      return chatWebsocketTransportInstance;
    }

    function getRoom() {
      // subject to change soon
      return session.domain._id;
    }
  }
})();
