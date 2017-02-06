(function() {

  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatLastConversationService', chatLastConversationService);

  function chatLastConversationService($q, session, localStorageService, CHAT_LOCAL_STORAGE) {
    var storage = localStorageService.getOrCreateInstance(CHAT_LOCAL_STORAGE.LAST_CONVERSATION);
    var service = {
      get: get,
      set: set
    };

    return service;

    function get() {
      return storage.getItem(session.user._id).then(function(result) {
        if (result && result._id) {
          return result._id;
        }
      });
    }

    function set(conversationId) {
      if (!conversationId) {
        return $q.reject(new Error('Conversation id is required'));
      }

      return storage.setItem(session.user._id, {_id: conversationId});
    }
  }

})();
