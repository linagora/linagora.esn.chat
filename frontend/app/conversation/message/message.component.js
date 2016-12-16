(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatMessage', chatMessage());

    function chatMessage() {
      return {
        bindings: {
          message: '='
        },
        templateUrl: '/chat/app/conversation/message/message.html',
        controller: 'chatMessageController',
        controllerAs: 'ctrl'
      };
    }
})();
