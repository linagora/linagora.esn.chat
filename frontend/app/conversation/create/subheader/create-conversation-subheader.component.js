(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationCreateSubheader', chatConversationCreateSubheader());

  function chatConversationCreateSubheader() {
    var component = {
      templateUrl: '/chat/app/conversation/create/subheader/create-conversation-subheader.html',
      controllerAs: 'ctrl',
      bindings: {
        create: '&',
        form: '='
      }
    };

    return component;
  }

})();
