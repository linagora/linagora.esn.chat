(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageService', chatMessageService);

  function chatMessageService($q, $log, $rootScope, chatMessengerService, fileUploadService, backgroundProcessorService, CHAT_MESSAGE_TYPE, DEFAULT_FILE_TYPE, CHAT_SYSTEM_MESSAGE_SUBTYPES, _) {
    return {
      isSystemMessage: isSystemMessage,
      sendMessage: sendMessage,
      sendMessageWithAttachments: sendMessageWithAttachments,
      sendUserTyping: sendUserTyping
    };

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

    function isSystemMessage(message) {
      return _.contains(CHAT_SYSTEM_MESSAGE_SUBTYPES, message.subtype);
    }

    function _sendMessage(message) {
      $log.debug('Send message', message);

      return chatMessengerService.sendMessage(message);
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

        return _sendMessage(buildMessage(message, attachments)).then(function(response) {
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

    function sendUserTyping(message) {
      message.type = CHAT_MESSAGE_TYPE.USER_TYPING;

      return _sendMessage(message);
    }

    function sendMessage(message) {
      message.type = CHAT_MESSAGE_TYPE.TEXT;

      return _sendMessage(message);
    }
  }
})();
