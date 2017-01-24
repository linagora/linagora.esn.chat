(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchConversationService', chatSearchConversationService);

    ////////////

    function chatSearchConversationService(ChatRestangular) {
      return {
        searchConversations: searchConversations
      };

      function searchConversations(term, options) {
        options = angular.extend({search: term}, options);

        return ChatRestangular.all('conversations').getList(options);
      }
    }
})();
