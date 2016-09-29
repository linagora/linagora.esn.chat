(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationView', chatConversationViewDirective);

  function chatConversationViewDirective() {
    var directive = {
      restrict: 'E',
      controller: 'chatConversationViewController',
      templateUrl: '/chat/views/components/conversation-view/conversation-view.html',
      scope: {
        displayTopic: '='
      }
    };

    return directive;
  }
})();
