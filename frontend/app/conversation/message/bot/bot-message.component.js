(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatBotMessage', chatBotMessage());

    function chatBotMessage() {
      return {
        bindings: {
          message: '='
        },
        templateUrl: '/chat/app/conversation/message/bot/bot-message.html',
        controller: 'chatBotMessageController',
        controllerAs: 'ctrl'
      };
    }
})();
