(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatTransportService', ChatTransportService);

    function ChatTransportService($log, $q, livenotification, CHAT_NAMESPACE) {

      function ChatTransportService(options) {
        this.options = options;
      }

      ChatTransportService.prototype.sendMessage = function(message) {
        $log.info('Send chat message to peers', message);
        this.sio.send('message', message);

        return $q.when(message);
      };

      ChatTransportService.prototype.connect = function(onMessage) {
        var self = this;

        if (!this.sio) {
          this.sio = livenotification(CHAT_NAMESPACE, self.options.room);

          this.sio.on('message', function(message) {
            $log.debug('Got a chat message on transport', message);
            onMessage(message);
          });

          this.sio.on('connected', function() {
            $log.info('Connected to chat');
          });
          this.sio = livenotification(CHAT_NAMESPACE);
        }
      };

      return ChatTransportService;
    }
})();
