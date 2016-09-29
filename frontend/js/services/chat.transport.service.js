(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatTransport', ChatTransport);

    ChatTransport.$inject = ['$log', '$q', 'livenotification', 'CHAT_NAMESPACE', 'CHAT_EVENTS'];

    function ChatTransport($log, $q, livenotification, CHAT_NAMESPACE, CHAT_EVENTS) {

      function ChatTransport(options) {
        this.options = options;
      }

      ChatTransport.prototype.sendMessage = function(message) {
        $log.info('Send message to peers', message);
        this.sio.send('message', message);

        return $q.when(message);
      };

      ChatTransport.prototype.connect = function(onMessage) {
        var self = this;

        if (!this.sio) {
          this.sio = livenotification(CHAT_NAMESPACE, self.options.room);

          this.sio.on('message', function(message) {
            $log.debug('Got a message on transport', message);
            onMessage(message);
          });

          this.sio.on('connected', function() {
            $log.info('Connected');
          });
          this.sio = livenotification(CHAT_NAMESPACE);
          this.sio.on(CHAT_EVENTS.TOPIC_UPDATED, onMessage);
        }
      };

      return ChatTransport;
    }
})();
