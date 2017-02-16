(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationResolverService', chatConversationResolverService);

    function chatConversationResolverService($q, $state, chatConversationService, chatLastConversationService, chatConversationsStoreService, chatConversationActionsService) {

      // we must pass value of $stateParams.id from caller due to this
      // https://github.com/angular-ui/ui-router/issues/853
      return function(conversationId) {
        return chatConversationActionsService.ready.then(resolve.bind(null, conversationId));
      };

      function getDefaultChannel() {
        return chatConversationsStoreService.channels[0]._id;
      }

      function getLastConversationOrDefault() {
        return chatLastConversationService.get().then(function(lastConversationId) {
          return isValidConversation(lastConversationId).then(function(isLastValid) {
            if (!isLastValid) {
              lastConversationId = getDefaultChannel();
            }

            return lastConversationId;
          });
        });
      }

      function isValidConversation(id) {
        if (!id) {
          return $q.when(false);
        }

        return chatConversationService.get(id).then(function() {
          return true;
        }, function() {
          return false;
        });
      }

      function resolve(conversationId) {
        var deferred = $q.defer();

        function done(id) {
          $state.go('chat.channels-views', {id: id});
          deferred.resolve(id);
        }

        isValidConversation(conversationId).then(function(isValid) {
          if (isValid) {
            return deferred.resolve(conversationId);
          }

          getLastConversationOrDefault().then(done, function() {
            done(getDefaultChannel());
          });
        });

        return deferred.promise;
      }
    }
})();
