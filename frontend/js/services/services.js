(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular.module('linagora.esn.chat')

    .factory('ChatConversationService', function(ChatRestangular) {
      function fetchMessages(conversation, options) {
        return ChatRestangular.one(conversation).all('messages').getList(options).then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }

      function getMessage(id) {
        return ChatRestangular.all('messages').one(id).get().then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }

      return {
        getMessage: getMessage,
        fetchMessages: fetchMessages
      };
    });
})();
