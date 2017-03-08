(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationListController', ChatConversationListController);

  function ChatConversationListController(esnPaginationtionProviderBuilder, chatConversationService, CHAT) {
    var self = this;
    var options = {
      limit: self.elementsPerPage || CHAT.DEFAULT_FETCH_SIZE
    };

    esnPaginationtionProviderBuilder(self, 'ChatConversationList', chatConversationService.list, options);
  }
})();
