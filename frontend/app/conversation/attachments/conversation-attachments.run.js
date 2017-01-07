(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatConversationAttachmentsProvider, esnAttachmentListProviders) {
    esnAttachmentListProviders.add(chatConversationAttachmentsProvider);
  }
})();
