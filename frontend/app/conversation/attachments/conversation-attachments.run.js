(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(
    chatConversationAttachmentsProvider,
    esnAttachmentListProviders,
    chatConfiguration
  ) {
    chatConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      esnAttachmentListProviders.add(chatConversationAttachmentsProvider);
    });
  }
})();
