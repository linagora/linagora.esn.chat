(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationAttachmentsProvider', chatConversationAttachmentsProvider);

  function chatConversationAttachmentsProvider(chatConversationService, chatUsername, newProvider, CHAT, CHAT_ATTACHMENT_PROVIDER) {
    return newProvider({
      type: CHAT_ATTACHMENT_PROVIDER.conversation,
      fetch: function(options) {
        var offset = 0;

        return function() {
          var query = {limit: options.limit || CHAT.DEFAULT_FETCH_SIZE, offset: offset};

          return chatConversationService.fetchAttachments(options.id, query).then(function(attachments) {
            offset += attachments.data.length;

            return attachments.data.map(function(attachment) {
              attachment.type = CHAT_ATTACHMENT_PROVIDER.conversation;
              attachment.displayName = chatUsername.generate(attachment.creator);

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
