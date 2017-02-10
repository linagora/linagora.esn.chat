(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatWebsocketMessengerService', chatWebsocketMessengerService);

  function chatWebsocketMessengerService($log, chatWebsocketTransportService, session) {
    var chatWebsocketTransportInstance;

    return {
      get: get
    };

    function get() {
      if (chatWebsocketTransportInstance) {
        return chatWebsocketTransportInstance;
      }

      chatWebsocketTransportInstance = new chatWebsocketTransportService({
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
