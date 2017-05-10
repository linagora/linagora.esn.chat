(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarStarsListController', ChatConversationSidebarStarsListController);

  function ChatConversationSidebarStarsListController($log, $q, esnPaginationtionProviderBuilder, chatConversationService, chatConversationsStoreService, CHAT) {
    var self = this;
    var options = {
      offset: 0,
      limit: CHAT.DEFAULT_FETCH_SIZE
    };

    self.$onInit = $onInit;

    function $onInit() {
      getUserStarredMessagesProvider();
    }

    function getUserStarredMessages() {
      return chatConversationService.getUserStarredMessages(chatConversationsStoreService.activeRoom._id, options)
        .catch(function(err) {
          $log.error('Error while fetching starred messages', err);

          return $q.reject(new Error('Error while fetching starred messages'));
        });
    }

    function getUserStarredMessagesProvider() {
      esnPaginationtionProviderBuilder(self, 'conversationSidebarStars', getUserStarredMessages, options);
    }
  }
})();
