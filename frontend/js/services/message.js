'use strict';

angular.module('linagora.esn.chat')

  .factory('messageService', function(
        $q,
        $log,
        $rootScope,
        session,
        ChatWSTransport,
        fileUploadService,
        backgroundProcessorService,
        DEFAULT_FILE_TYPE) {

    var messageServicePromise = session.ready.then(function(session) {
      var userId = session.user._id;
      var domainId = session.domain._id;

      var transport = new ChatWSTransport({
        room: domainId,
        user: userId
      });

      function receiveMessage(message) {
        $log.debug('Got a message on chat service', message);

        if (!message.type) {
          $log.debug('Message does not have type, skipping');
          return;
        }

        if (message.user && message.user === userId) {
          $log.debug('My message, skipping');
          return;
        }

        $rootScope.$broadcast('chat:message:' + message.type, message);
      }

      var connected = false;
      function connect() {
        if (!connected) {
          transport.connect(receiveMessage);
        }
      }

      function sendMessage(message) {
        $log.debug('Send message', message);
        return transport.sendMessage(message);
      }

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

      function sendTextMessage(message) {
        message.type = 'text';
        return sendMessage(message);
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
        connect: connect,
        sendMessage: sendTextMessage,
        sendUserTyping: sendUserTyping,
        sendMessageWithAttachments: sendMessageWithAttachments
      };
    });

    function bindToPromiseResult(promise, methodName) {
      return function() {
        var arg = arguments;
        return promise.then(function(o) {
          return o[methodName].apply(o, arg);
        });
      };
    }

    return {
      connect: bindToPromiseResult(messageServicePromise, 'connect'),
      sendMessage: bindToPromiseResult(messageServicePromise, 'sendMessage'),
      sendUserTyping: bindToPromiseResult(messageServicePromise, 'sendUserTyping'),
      sendMessageWithAttachments: bindToPromiseResult(messageServicePromise, 'sendMessageWithAttachments'),
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
        this.sio = livenotification(CHAT_NAMESPACE, self.options.room);

        this.sio.on('message', function(message) {
          $log.debug('Got a message on transport', message);
          onMessage(message);
        });

        this.sio.on('connected', function() {
          $log.info('Connected');
        });
      }
    };

    return ChatWSTransport;
  });
