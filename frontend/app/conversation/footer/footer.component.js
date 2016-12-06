(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatFooter', chatFooterComponent());

  function chatFooterComponent() {
    var component = {
      templateUrl: '/chat/app/conversation/footer/footer.html',
      controllerAs: 'ctrl',
      controller: 'ChatFooterController',
      bindings: {
        conversation: '='
      }
    };

    return component;
  }
})();
