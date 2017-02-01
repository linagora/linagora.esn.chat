(function() {

  'use strict';

  angular.module('linagora.esn.chat')
  .factory('chatLastConversationService', chatLastConversationService);

  function chatLastConversationService($q, $log, localStorageService) {
    var storage = localStorageService.getOrCreateInstance('chat-conversation');
    var service = {
      saveConversationId: saveConversationId,
      getConversationId: getConversationId
    };

    return service;

    function saveConversationId(userId, conversationId) {
      return storage.setItem(userId, {conversationId: conversationId}).catch(function(error) {
        $log.error('Error while saving current conversation', error);
      });
    }

    function getConversationId(userId) {
      return storage.getItem(userId).then(function(result) {
        if (result) {
          return result.conversationId;
        }

        return $q.reject(new Error('No conversation for user' + userId));
      });
    }
  }

})();
