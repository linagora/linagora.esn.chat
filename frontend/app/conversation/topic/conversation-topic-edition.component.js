(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationTopicEdition', chatConversationTopicEdition());

  function chatConversationTopicEdition() {
    return {
      templateUrl: '/chat/app/conversation/topic/conversation-topic-edition.html',
      controllerAs: 'ctrl',
      controller: 'ChatConversationTopicEditionController',
      bindings: {
        conversation: '<'
      }
    };
  }
})();
