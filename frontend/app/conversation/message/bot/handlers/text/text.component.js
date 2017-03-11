(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatBotTextMessage', {
        bindings: {
          parsed: '='
        },
        templateUrl: '/chat/app/conversation/message/bot/handlers/text/text.html',
        controllerAs: 'ctrl'
      });
})();
