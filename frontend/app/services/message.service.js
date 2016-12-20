(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageService', chatMessageService);

    function chatMessageService($q, $log, $rootScope, session, ChatTransportService, fileUploadService, backgroundProcessorService, CHAT_MESSAGE_TYPE, DEFAULT_FILE_TYPE) {

      var chatMessageServicePromise = session.ready.then(function(session) {
        var userId = session.user._id;
        var domainId = session.domain._id;
        var transport = new ChatTransportService({
          room: domainId,
          user: userId
        });

        return {
          connect: connect,
          sendMessage: sendTextMessage,
          sendUserTyping: sendUserTyping,
          sendMessageWithAttachments: sendMessageWithAttachments
        };

        function isMeTyping(message) {
          return message.creator && message.creator === userId && message.type === CHAT_MESSAGE_TYPE.USER_TYPING;
        }

        function receiveMessage(message) {
          $log.debug('Received a message on chat service', message);

          if (!message.type) {
            $log.debug('Message does not have type, skipping');

            return;
          }

          if (isMeTyping(message)) {
            $log.debug('My message, skipping');

            return;
          }

          $rootScope.$broadcast('chat:message:' + message.type, message);
        }

        function connect() {
          transport.connect(receiveMessage);
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
          message.type = CHAT_MESSAGE_TYPE.USER_TYPING;

          return sendMessage(message);
        }

        function sendTextMessage(message) {
          message.type = CHAT_MESSAGE_TYPE.TEXT;

          return sendMessage(message);
        }

        function sendMessageWithAttachments(message, files) {
          var filesUploadDefer = $q.defer();
          var uploadService = fileUploadService.get();
          var attachments = files.map(function(file) {
            return uploadService.addFile(file, true);
          });

          message.type = CHAT_MESSAGE_TYPE.FILE;

          function filesUploaded(attachments) {
            $log.debug('Upload complete');

            return sendMessage(buildMessage(message, attachments)).then(function(response) {
              $log.debug('Message with files has been sent');
              filesUploadDefer.resolve(response);
            }, function(err) {
              filesUploadDefer.reject(err);
              $log.error('Error while sending message with files', err);
            });
          }

          if (uploadService.isComplete()) {
            filesUploaded(attachments);
          } else {
            backgroundProcessorService.add(uploadService.await(filesUploaded));
          }

          return filesUploadDefer.promise;
        }
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
        sendMessageWithAttachments: bindToPromiseResult(chatMessageServicePromise, 'sendMessageWithAttachments')
      };
    }
})();
