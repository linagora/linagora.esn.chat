(function() {
  'use strict';

  angular.module('linagora.esn.chat')
         .component('chatSubheaderButton', chatSubheaderButton());

  function chatSubheaderButton() {
    var component = {
      templateUrl: '/chat/app/components/subheader-button/subheader-button.html',
      bindings: {
        chatDisabled: '=?',
        chatClick: '&?',
        chatIconClass: '@?',
        chatIconText: '@?',
        chatIconPosition: '@?'
      },
      controllerAs: 'ctrl'
    };

    return component;
  }

})();
