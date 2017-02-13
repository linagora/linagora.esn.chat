(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatWebsocketTransportService', ChatWebsocketTransportService);

    function ChatWebsocketTransportService($log, $q, livenotification, _, CHAT_NAMESPACE, CHAT_WEBSOCKET_EVENTS) {

      function ChatWebsocketTransportService(options) {
        this.options = options;
        this.handlers = {};
      }

      ChatWebsocketTransportService.prototype.addEventListener = function(event, handler) {
        if (this.sio) {
          return this.sio.on(event, handler);
        }

        this.handlers[event] = handler;
      };

      ChatWebsocketTransportService.prototype.connect = function() {
        if (!this.sio) {
          var self = this;

          self.sio = livenotification(CHAT_NAMESPACE, self.options.room);
          _.forEach(self.handlers, function(handler, event) {
            self.sio.on(event, handler);
          });

          self.sio.on('connected', function() {
            $log.info('Connected to chat websocket');
          });
        }

        return this;
      };

      ChatWebsocketTransportService.prototype.sendRawMessage = function(type, data) {
        if (!this.sio) {
          return $q.reject(new Error('Not connected to the websocket'));
        }

        $log.debug('Send raw message', type, data);
        this.sio.send(type, data);

        return $q.when(data);
      };

      ChatWebsocketTransportService.prototype.sendMessage = function(message) {
        $log.debug('Send chat message to peers', message);

        return this.sendRawMessage(CHAT_WEBSOCKET_EVENTS.MESSAGE, message);
      };

      return ChatWebsocketTransportService;
    }
})();
