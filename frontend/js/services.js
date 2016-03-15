'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatMessageAdapter', function($q, userAPI) {

    function fromAPI(message) {
      // TODO: Cache the user profile
      if (message.user) {
        return userAPI.user(message.user).then(function(response) {
          message.user = response.data;
          return message;
        });
      }

      return $q.when(message);
    }

    return {
      fromAPI: fromAPI
    };
  })

  .factory('ChatConversationService', function($q, session) {

    /**
     * Fetch conversation history for the current user
     *
     * @param options
     * @returns {Promise}
     */
    function fetchHistory(options) {
      var history = [
        {
          channel_name: 'openpaas',
          channel: {
            type: 'channel'
          },
          last_message: {
            user: {displayName: 'Davil Parnell'},
            text: 'Hello, how are you?!',
            date: Date.now()
          }
        },
        {
          channel_name: 'christophe',
          last_message: {
            user: {displayName: 'Ann Watkinson'},
            text: 'This is fun, thx again',
            date: Date.now()
          }
        },
        {
          channel_name: 'barcamp',
          channel: {
            type: 'channel'
          },
          last_message: {
            user: {displayName: 'Jeremy Robbins'},
            text: 'See you on monday guys, have a nice weekend',
            date: Date.now()
          }
        },
        {
          channel_name: 'todo',
          channel: {
            type: 'channel'
          },
          last_message: {
            user: {displayName: 'Jeremy Robbins'},
            text: 'YOLO!',
            date: Date.now()
          }
        }
      ];

      return $q.when(history);
    }

    function fetchMessages(options) {

      var user = session.user;
      user.displayName = '@chamerling';

      var messages = [
        {
          user: user,
          text: 'Hello, how are you?!',
          date: Date.now()
        },
        {
          user: user,
          text: 'Mauris volutpat magna nibh, et condimentum est rutrum a. Nunc sed turpis mi. In eu massa a sem pulvinar lobortis.',
          date: Date.now()
        },
        {
          user: user,
          text: 'Etiam ex arcumentum',
          date: Date.now()
        },
        {
          user: user,
          text: 'Etiam nec facilisis lacus. Nulla imperdiet augue ullamcorper dui ullamcorper, eu laoreet sem consectetur. Aenean et ligula risus. Praesent sed posuere sem. Cum sociis natoque penatibus et magnis dis parturient montes',
          date: Date.now()
        },
        {
          user: user,
          text: 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam ac tortor ut elit sodales varius. Mauris id ipsum id mauris malesuada tincidunt. Vestibulum elit massa, pulvinar at sapien sed, luctus vestibulum eros. Etiam finibus tristique ante, vitae rhoncus sapien volutpat eget',
          date: Date.now()
        }
      ];

      messages.forEach(function(message, index) {
        message.date = message.date + index;
      });
      return $q.when(messages);
    }

    return {
      fetchHistory: fetchHistory,
      fetchMessages: fetchMessages
    };
  })

  .service('ChatService', function($q, $log, $rootScope) {

    function ChatService(options) {
      this.options = options;
      this.transport = options.transport;
    }

    ChatService.prototype.connect = function() {
      this.transport.connect(this.receiveMessage.bind(this));
    };

    ChatService.prototype.sendMessage = function(message) {
      $log.debug('Send message', message);
      return this.transport.sendMessage(message);
    };

    ChatService.prototype.receiveMessage = function(message) {
      $log.debug('Got a message on chat service', message);

      if (!message.type) {
        $log.debug('Message does not have type, skipping');
        return;
      }

      if (message.user && message.user === this.options.user) {
        $log.debug('My message, skipping');
        return;
      }

      $rootScope.$broadcast('chat:message:' + message.type, message);
    };

    return ChatService;

  })

  .service('ChatWSTransport', function($rootScope, $log, $q, livenotification) {

    function ChatWSTransport(options) {
      this.options = options;
    }

    ChatWSTransport.prototype.sendMessage = function(message) {
      $log.info('Send message to peers', message);
      this.sio.send('message', message);
      // TODO: ACK
      return $q.when(message);
    };

    ChatWSTransport.prototype.connect = function(onMessage) {
      var self = this;
      if (!this.sio) {
        this.sio = livenotification(self.options.ns, self.options.room);

        this.sio.on('message', function(message) {
          $log.debug('Got a message on transport', message);
          onMessage.call(this, message);
        });

        this.sio.on('connected', function() {
          $log.info('Connected');
        });
      }
    };

    return ChatWSTransport;
  });
