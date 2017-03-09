(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatUserTyping', chatUserTypingComponent());

    function chatUserTypingComponent() {
      return {
        controller: 'ChatUserTypingController',
        controllerAs: 'ctrl',
        templateUrl: '/chat/app/conversation/user-typing/user-typing.html'
      };
    }
})();
