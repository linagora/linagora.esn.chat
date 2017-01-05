(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatMessageIndicator', chatMessageIndicator());

    function chatMessageIndicator() {
      var component = {
        templateUrl: '/chat/app/conversation/message-indicator/message-indicator.html',
        controllerAs: 'ctrl',
        controller: 'ChatMessageIndicatorController',
        bindings: {
          inview: '<'
        }
      };

      return component;
    }

})();
