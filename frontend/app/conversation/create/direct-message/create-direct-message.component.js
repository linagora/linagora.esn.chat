(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationCreateDirectMessage', chatConversationCreateDirectMessage());

  function chatConversationCreateDirectMessage() {
    var component = {
      templateUrl: '/chat/app/conversation/create/direct-message/create-direct-message.html',
      controller: 'ChatConversationCreateDirectMessageController',
      controllerAs: 'ctrl'
    };

    return component;
  }
})();
