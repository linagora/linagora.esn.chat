(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationCreatePrivate', chatConversationCreatePrivate());

  function chatConversationCreatePrivate() {
    var component = {
      templateUrl: '/chat/app/conversation/create/private/create-private.html',
      controller: 'ChatConversationCreatePrivateController',
      controllerAs: 'ctrl'
    };

    return component;
  }
})();
