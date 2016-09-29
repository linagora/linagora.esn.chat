(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationItem', chatConversationItem);

  function chatConversationItem() {
    var directive = {
      restrict: 'E',
      scope: {
        item: '=',
        channelState: '=?'
      },
      controller: 'chatConversationItemController',
      templateUrl: '/chat/views/aside/conversation-item.html'
    };

    return directive;
  }
})();
