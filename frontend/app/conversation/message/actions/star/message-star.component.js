(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatMessageStar', chatMessageStar());

    function chatMessageStar() {
      return {
        bindings: {
          starred: '=',
          toggle: '='
        },
        templateUrl: '/chat/app/conversation/message/actions/star/message-star.html',
        controllerAs: 'ctrl'
      };
    }
})();
