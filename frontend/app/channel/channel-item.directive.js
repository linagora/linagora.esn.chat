(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatChannelItem', chatChanelItem);

  function chatChanelItem() {
    var directive = {
      restrict: 'E',
      scope: {
        item: '=',
        channelState: '=?'
      },
      controller: 'ChatChannelItemController',
      controllerAs: 'vm',
      bindToController: true,
      templateUrl: '/chat/app/channel/channel-item.html'
    };

    return directive;
  }
})();
