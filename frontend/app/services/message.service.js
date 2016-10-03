(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')

    .factory('chatMessageService', function(
          $q,
          $log,
          $rootScope,
          session,
          ChatTransportService,
          fileUploadService,
          backgroundProcessorService,
          MESSAGE_TYPE,
          DEFAULT_FILE_TYPE) {

      var chatMessageServicePromise = session.ready.then(function(session) {
        var userId = session.user._id;
        var domainId = session.domain._id;

        var transport = new ChatTransportService({
          room: domainId,
          user: userId
        });

        function isMeTyping(message) {
          return message.creator && message.creator === userId && message.type === MESSAGE_TYPE.TYPING;
        }

        function receiveMessage(message) {
          $log.debug('Got a message on chat service', message);

          if (!message.type) {
            $log.debug('Message does not have type, skipping');

            return;
          }

          if (isMeTyping(message)) {
            $log.debug('My message, skipping');

            return;
          }

          var eventName = 'chat:message:' + message.type;

          if (message.subtype) {
            eventName += ':' + message.subtype;
          }
          $rootScope.$broadcast(eventName, message);
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
          message.type = 'file';
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
        connect: bindToPromiseResult(chatMessageServicePromise, 'connect'),
        sendMessage: bindToPromiseResult(chatMessageServicePromise, 'sendMessage'),
        sendUserTyping: bindToPromiseResult(chatMessageServicePromise, 'sendUserTyping'),
        sendMessageWithAttachments: bindToPromiseResult(chatMessageServicePromise, 'sendMessageWithAttachments'),
      };
    });
})();
