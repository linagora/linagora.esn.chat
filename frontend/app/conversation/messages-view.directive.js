(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatMessagesView', chatMessagesViewDirective);

  function chatMessagesViewDirective(chatConversationsService) {
    var directive = {
      restrict: 'E',
      scope: {
        conversation: '=',
        messages: '=',
        loadPreviousMessages: '&',
        spinnerKey: '=',
        topOfConversation: '=',
        setLastLineInView: '='
      },
      templateUrl: '/chat/app/conversation/messages-view.html',
      link: link
    };

    return directive;

    function link(scope) {
      chatConversationsService.getConversationNamePromise.then(function(getConversationName) {
        scope.getConversationName = getConversationName;
      });
    }
  }
})();
