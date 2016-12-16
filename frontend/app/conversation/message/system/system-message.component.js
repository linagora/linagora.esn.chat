(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatSystemMessage', chatSystemMessage());

    function chatSystemMessage() {
      return {
        bindings: {
          message: '='
        },
        templateUrl: '/chat/app/conversation/message/system/system-message.html',
        controller: 'chatSystemMessageController',
        controllerAs: 'ctrl'
      };
    }
})();
