(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatFileUploadController', chatFileUploadController);

    function chatFileUploadController($log, $scope, session, chatLocalStateService, chatMessageService) {
      var self = this;

      self.onFileSelect = onFileSelect;

      function buildCurrentMessage() {
        return {
          text: '',
          creator: session.user._id,
          channel: chatLocalStateService.activeRoom._id,
          date: Date.now()
        };
      }

      function onFileSelect(files) {
        $log.debug('Sending message with attachments', files);
        chatMessageService.sendMessageWithAttachments(buildCurrentMessage(), files).catch(function(err) {
          $log.error('Error while uploading message', err);
        });
      }
    }
})();
