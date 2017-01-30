(function() {

  'use strict';

  angular.module('linagora.esn.chat')
  .factory('chatLastConversationService', chatLastConversationService);

  function chatLastConversationService($log, localStorageService) {
    var storage = localStorageService.getOrCreateInstance('chat-conversation');
    var service = {
      saveConversationId: saveConversationId,
      getConversationId: getConversationId
    };

    return service;

    function saveConversationId(userId, channelId) {
      return storage.setItem(userId, channelId).catch(function(error) {
        $log.error('Error while saving current conversation', error);
      });
    }

    function getConversationId(userId) {
      return storage.getItem(userId).catch(function(error) {
        $log.error('Cannot get current conversation', error);
      });
    }
  }

})();
