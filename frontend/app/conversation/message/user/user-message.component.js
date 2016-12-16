(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatUserMessage', chatUserMessage());

    function chatUserMessage() {
      return {
        bindings: {
          message: '='
        },
        templateUrl: '/chat/app/conversation/message/user/user-message.html',
        controller: 'chatUserMessageController',
        controllerAs: 'ctrl'
      };
    }
})();
