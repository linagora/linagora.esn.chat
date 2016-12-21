(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatMessagesView', chatMessagesView());

  function chatMessagesView() {
    return {
      bindings: {
        conversation: '=',
        messages: '=',
        loadPreviousMessages: '&',
        spinnerKey: '=',
        topOfConversation: '=',
        setLastLineInView: '=',
        inview: '<'
      },
      controllerAs: 'ctrl',
      templateUrl: '/chat/app/conversation/messages-view.html'
    };
  }
})();
