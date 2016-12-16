(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatMessageSeparator', chatMessageSeparator());

  function chatMessageSeparator() {
    return {
      bindings: {
        prevMessage: '=?',
        currentMessage: '='
      },
      templateUrl: '/chat/app/conversation/message-separator/message-separator.html',
      controller: 'chatMessageSeparatorController',
      controllerAs: 'ctrl'
    };
  }
})();
