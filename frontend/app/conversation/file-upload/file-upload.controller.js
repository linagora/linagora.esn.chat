(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatFileUploadController', chatFileUploadController);

    function chatFileUploadController(
      $log,
      $scope,
      notificationFactory,
      session,
      chatConversationMemberService,
      chatConversationsStoreService,
      chatMessageService
    ) {
      var self = this;

      self.onFileSelect = onFileSelect;

      function buildCurrentMessage() {
        return {
          text: '',
          creator: session.user._id,
          channel: chatConversationsStoreService.activeRoom._id,
          date: Date.now()
        };
      }

      function onFileSelect(files) {
        if (!files || !files.length) {
          // onFileSelect may be called on button click before selecting files
          return;
        }

        if (!chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom)) {
          notificationFactory.weakError('error', 'You can not upload files without being a member');

          return;
        }

        $log.debug('Sending message with attachments', files);
        chatMessageService.sendMessageWithAttachments(buildCurrentMessage(), files)
          .catch(function(err) {
            $log.error('Error while sending message with attachments', err);
          });
      }
    }
})();
