(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationService', chatConversationService);

    chatConversationService.$inject = ['ChatRestangular'];

    function chatConversationService(ChatRestangular) {
      var service = {
        getMessage: getMessage,
        fetchMessages: fetchMessages
      };

      return service;

      function fetchMessages(conversation, options) {
        return ChatRestangular.all('conversations').one(conversation).all('messages').getList(options).then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }

      function getMessage(id) {
        return ChatRestangular.all('messages').one(id).get().then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }
    }
})();
