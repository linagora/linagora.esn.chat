(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationHeader', chatConversationHeader());

    function chatConversationHeader() {
      var component = {
        templateUrl: '/chat/app/conversation/header/header.html',
        controllerAs: 'ctrl',
        controller: 'ChatConversationHeaderController',
        bindings: {
          conversation: '='
        }
      };

      return component;
    }

})();
