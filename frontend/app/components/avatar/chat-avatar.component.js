(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatAvatar', chatAvatarComponent());

  function chatAvatarComponent() {
    return {
      templateUrl: '/chat/app/components/avatar/chat-avatar.html',
      controllerAs: 'ctrl',
      bindings: {
        userId: '='
      }
    };
  }
})();
