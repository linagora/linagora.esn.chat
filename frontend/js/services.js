'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/chat/api/chat');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('ChatMessageAdapter', function($q, userAPI) {

    var cache = {};

    function getUser(id) {
      if (cache[id]) {
        return $q.when(cache[id]);
      }

      return userAPI.user(id).then(function(response) {
        cache[id] = response.data;
        return response.data;
      });
    }

    function fromAPI(message) {
      if (message.user) {
        return getUser(message.user).then(function(user) {
          message.user = user;
          return message;
        });
      }

      return $q.when(message);
    }

    return {
      fromAPI: fromAPI,
      getUser: getUser
    };
  })

  .factory('ChatConversationService', function($q, session, ChatRestangular) {

    function fetchMessages(channel, options) {
      return ChatRestangular.one(channel).all('messages').getList(options).then(function(response) {
        return response.data.map(function(message) {
          message.user = message.creator;
          message.date = message.timestamps.creation;
          return message;
        });
      });
    }

    function getChannels(options) {
      return ChatRestangular.all('channels').getList(options);
    }

    function postChannels(channel) {
      return ChatRestangular.one('channels').customPOST(channel);
    }

    return {
      fetchMessages: fetchMessages,
      getChannels: getChannels,
      postChannels: postChannels
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

  .factory('chatScrollDown', function($timeout, elementScrollService) {
    return function() {
      elementScrollService.autoScrollDown($('.ms-body .lv-body'));
    };
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
