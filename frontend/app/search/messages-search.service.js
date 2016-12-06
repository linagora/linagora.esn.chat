(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatSearchMessageService', chatSearchMessageService);

    chatSearchMessageService.$inject = ['ChatRestangular'];

    ////////////

    function chatSearchMessageService(ChatRestangular) {
      var service = {
        searchMessages: searchMessages
      };

      return service;

      function searchMessages(term, options) {
        options = angular.extend({search: term}, options);

        return ChatRestangular.all('messages').getList(options);
      }
    }
})();
