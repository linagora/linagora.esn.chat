(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatLaunchConversationService', chatLaunchConversationService);

  function chatLaunchConversationService($q, $log, $state, chatConversationActionsService) {

    return {
      launch: launch
    };

    function getDefaultSuccess(result) {
      return $state.go('chat.channels-views', {id: result._id});
    }

    function launch(userIds, onSuccess) {
      if (!angular.isArray(userIds)) {
        userIds = [userIds];
      }

      onSuccess = onSuccess || getDefaultSuccess;

      return chatConversationActionsService.createConfidentialConversation({members: userIds})
        .then(function(response) {
          return onSuccess(response.data);
        })
        .catch(function(err) {
          $log.error('Could not create conversation with members', userIds, err);

          return $q.reject(err);
        });
    }
  }
})();
