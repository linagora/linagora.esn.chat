(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationResolverService', chatConversationResolverService);

    function chatConversationResolverService($q, $log, $state, chatConversationService, chatLastConversationService, chatConversationsStoreService, chatConversationActionsService) {

      // we must pass value of $stateParams.id from caller due to this
      // https://github.com/angular-ui/ui-router/issues/853
      return function(conversationId) {
        return chatConversationActionsService.ready.then(resolve.bind(null, conversationId));
      };

      function fallbackToLastConversation() {
        return chatLastConversationService.get().then(fetchConversation);
      }

      function fallbackToLastOrDefaultConversation() {
        return fallbackToLastConversation().then(switchTo, function(err) {
          $log.debug('Can not get last conversation', err.message);

          return switchTo(getDefaultConversation());
        });
      }

      function fetchConversation(id) {
        if (!id) {
          return $q.reject(new Error('conversation id is null'));
        }

        return chatConversationService.get(id);
      }

      function getDefaultConversation() {
        return chatConversationsStoreService.channels[0];
      }

      function resolve(conversationId) {
        return fetchConversation(conversationId).catch(fallbackToLastOrDefaultConversation);
      }

      function switchTo(conversation) {
        if (!conversation) {
          return $q.reject(new Error('Can not find any valid conversation to display'));
        }
        $state.go('chat.channels-views', {id: conversation._id});

        return conversation;
      }
    }
})();
