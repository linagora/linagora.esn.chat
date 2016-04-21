'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/chat/api/chat');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('ChatMessageSender', function($log, $q, fileUploadService, backgroundProcessorService, DEFAULT_FILE_TYPE) {

    return {
      get: function(chatService) {

        function buildMessage(message, attachments) {
          if (attachments) {
            var attachmentsModel = attachments.map(function(attachment) {
              var type = attachment.file.type;
              if (!type || type.length === 0) {
                type = DEFAULT_FILE_TYPE;
              }

              return {
                _id: attachment.response.data._id,
                name: attachment.file.name,
                contentType: type,
                length: attachment.file.size
              };
            });
            message.attachments = attachmentsModel;
          }
          return message;
        }

        function sendUserTyping(message) {
          message.type = 'user_typing';
          return sendMessage(message);
        }

        function sendMessage(message) {
          return chatService.sendMessage(message);
        }

        function sendMessageWithAttachments(message, files) {

          var uploadService = fileUploadService.get();
          var attachments = [];

          for (var i = 0; i < files.length; i++) {
            attachments.push(uploadService.addFile(files[i], true));
          }

          if (uploadService.isComplete()) {
            return sendMessage(buildMessage(message, attachments)).then(function(response) {
              $log.info('Message has been sent');
              return response;
            }, function(err) {
              $log.error('Message has not been sent', err);
            });
          } else {
            var defer = $q.defer();
            $log.debug('Publishing message...');
            var done = function(attachments) {
              $log.debug('Upload complete');
              return sendMessage(buildMessage(message, attachments)).then(function(response) {
                $log.debug('Message has been sent');
                defer.resolve(response);
              }, function(err) {
                defer.reject(err);
                $log.error('Error while sending message', err);
              });
            };
            backgroundProcessorService.add(uploadService.await(done));
            return defer.promise;
          }
        }

        return {
          sendMessageWithAttachments: sendMessageWithAttachments,
          sendMessage: sendMessage,
          sendUserTyping: sendUserTyping
        };
      }
    };
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

  .factory('listenChatWebsocket', function(
        $rootScope,
        session,
        _,
        livenotification,
        ChatConversationService,
        CHAT_NAMESPACE,
        CHAT_EVENTS) {
    return {
      initListener: function() {
        session.ready.then(function(session) {
          var sio = livenotification(CHAT_NAMESPACE);
          sio.on(CHAT_EVENTS.USER_CHANGE_STATE, function(data) {
            $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, data);
          });
        });
      }
    };
  })

  .factory('userState', function($q, $rootScope, _, CHAT_EVENTS, ChatRestangular) {
    var cache = {};

    $rootScope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
      cache[data.userId] = data.state;
    });

    return {
      get: function(userId) {
        if (cache[userId]) {
          return $q.when(cache[userId]);
        }

        return ChatRestangular.one('state', userId).get().then(function(response) {
          var state = response.data.state;
          cache[userId] = state;
          return state;
        });
      }
    };
  })

  .factory('ChatConversationService', function($q, session, ChatRestangular, _) {
    function fetchMessages(channel, options) {
      return ChatRestangular.one(channel).all('messages').getList(options).then(function(response) {
        return response.data.map(function(message) {
          message.user = message.creator;
          message.date = message.timestamps.creation;
          return message;
        });
      });
    }

    return {
      fetchMessages: fetchMessages
    };
  })

  .factory('ChatService', function($q, $log, $rootScope) {

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

  .factory('ChatScroll', function($timeout, elementScrollService) {

    function scrollDown() {
      elementScrollService.autoScrollDown($('.ms-body .lv-body'));
    }

    return {
      scrollDown: scrollDown
    };
  })

  .factory('ChatWSTransport', function($rootScope, $log, $q, livenotification, CHAT_NAMESPACE) {

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
        this.sio = livenotification(self.options.ns || CHAT_NAMESPACE, self.options.room);

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
