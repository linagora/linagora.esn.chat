(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatAside', chatAsideComponent());

  function chatAsideComponent() {
    var component = {
      templateUrl: '/chat/app/aside/aside.html',
      controller: 'chatAsideController',
      controllerAs: 'vm'
    };

    return component;
  }
})();
