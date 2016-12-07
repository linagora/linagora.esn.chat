(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationOverview', chatConversationOverview);

  function chatConversationOverview() {
    var directive = {
      restrict: 'E',
      scope: {
        item: '=',
        channelState: '=?'
      },
      controller: 'ChatConversationItemController',
      controllerAs: 'vm',
      bindToController: true,
      templateUrl: '/chat/app/conversation/overview/conversation-overview.html'
    };

    return directive;
  }
})();
