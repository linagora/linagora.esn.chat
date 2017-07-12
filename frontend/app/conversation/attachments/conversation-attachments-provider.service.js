(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationAttachmentsProvider', chatConversationAttachmentsProvider);

  function chatConversationAttachmentsProvider($q, chatConversationService, chatUsername, newProvider, CHAT_ATTACHMENT_PROVIDER, ELEMENTS_PER_REQUEST) {
    return newProvider({
      type: CHAT_ATTACHMENT_PROVIDER.conversation,
      fetch: function(options) {
        var offset = 0;

        return function() {
          return chatConversationService.fetchAttachments(options.id, {limit: ELEMENTS_PER_REQUEST, offset: offset}).then(function(attachments) {
            offset += attachments.data.length;

            return attachments.data.map(function(attachment) {
              attachment.type = CHAT_ATTACHMENT_PROVIDER.conversation;
              chatUsername.getFromCache(attachment.creator._id, false).then(function(creator) {
                if (!attachment.creator.firstname || !attachment.creator.lastname) {
                  attachment.creator.emails = [creator];
                }
                attachment.displayName = creator;
              });

              attachment.date = new Date(attachment.creation_date);

              return attachment;
            });
          });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options);
      },
      templateUrl: '/chat/app/conversation/attachments/conversation-attachments-item.html'
    });
  }
})();
