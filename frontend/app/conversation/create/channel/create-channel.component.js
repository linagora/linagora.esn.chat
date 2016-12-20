(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationCreateChannel', chatConversationCreateChannel());

  function chatConversationCreateChannel() {
    var component = {
      templateUrl: '/chat/app/conversation/create/channel/create-channel.html',
      controller: 'ChatConversationCreateChannelController',
      controllerAs: 'ctrl'
    };

    return component;
  }
})();
