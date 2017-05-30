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
      return chatConversationService.getUserStarredMessages(options)
        .then(function(response) {
          var customizedResponse = response;
          customizedResponse.data = customizedResponse.data.filter(function(message) {
            return message.channel === chatConversationsStoreService.activeRoom._id;
          });
          return customizedResponse;
        })
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
