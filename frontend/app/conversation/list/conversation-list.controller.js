(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationListController', ChatConversationListController);

  function ChatConversationListController(esnPaginationtionProviderBuilder, chatConversationService, CHAT, chatSearchConversationService) {
    var self = this;

    self.onChange = onChange;
    self.$onInit = $onInit;

    var options = {
      limit: self.elementsPerPage || CHAT.DEFAULT_FETCH_SIZE,
      offset: 0
    };

    function $onInit() {
      getChannelProvider();
    }

    function getChannelProvider() {
      esnPaginationtionProviderBuilder(self, 'ChatConversationList', chatConversationService.list, options);
    }

    function getSearchProvider() {
      esnPaginationtionProviderBuilder(self, 'ChatConversationList', search, options);
    }

    function onChange() {
      self.elements = [];
      self.infiniteScrollCompleted = false;

      if (!self.conversationSearchInput || self.conversationSearchInput.length === 0) {
        getChannelProvider();
      } else {
        getSearchProvider();
      }

      self.loadMoreElements();
    }

    function search(options) {
      return chatSearchConversationService.searchConversations(self.conversationSearchInput, options);
    }
  }
})();
