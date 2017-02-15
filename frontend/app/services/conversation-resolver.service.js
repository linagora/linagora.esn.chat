(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationResolverService', chatConversationResolverService);

    function chatConversationResolverService($q, $state, chatLastConversationService, chatConversationsStoreService, chatConversationActionsService) {

      // we must pass value of $stateParams.id from caller due to this
      // https://github.com/angular-ui/ui-router/issues/853
      return function(conversationId) {
        return chatConversationActionsService.ready.then(resolve.bind(null, conversationId));
      };

      function getDefaultChannel() {
        return chatConversationsStoreService.channels[0]._id;
      }

      function isValidConversation(id) {
        return !!chatConversationsStoreService.findConversation(id);
      }

      function resolve(conversationId) {
        var deferred = $q.defer();

        function done(id) {
          $state.go('chat.channels-views', {id: id});
          deferred.resolve(id);
        }

        if (!isValidConversation(conversationId)) {
          chatLastConversationService.get().then(function(id) {
            if (!isValidConversation(id)) {
              id = getDefaultChannel();
            }

            done(id);
          }, function() {
            done(getDefaultChannel());
          });
        } else {
          deferred.resolve(conversationId);
        }

        return deferred.promise;
      }
    }
})();
