(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationView', chatConversationView);

  function chatConversationView() {
    var directive = {
      restrict: 'E',
      controller: 'ChatConversationViewController',
      controllerAs: 'vm',
      bindToController: true,
      templateUrl: '/chat/views/components/conversation-view/conversation-view.html',
      scope: {
        displayTopic: '='
      }
    };

    return directive;
  }
})();
