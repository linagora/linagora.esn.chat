(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatLaunchConversationButton', chatLaunchConversationButton());

  function chatLaunchConversationButton() {
    return {
      templateUrl: '/chat/app/components/launch-conversation-button/launch-conversation-button.html',
      bindings: {
        userId: '@'
      },
      controllerAs: 'ctrl',
      controller: 'chatLaunchConversationButtonController'
    };
  }
})();
