(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationSubheader', chatConversationSubheader());

  function chatConversationSubheader() {
    var component = {
      templateUrl: 'chat/app/conversation/subheader/conversation-subheader.html',
      controller: 'ChatConversationSubheaderController',
      controllerAs: 'ctrl'
    };

    return component;
  }

})();
