(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .config(injectApplicationMenu);

  function injectApplicationMenu(dynamicDirectiveServiceProvider) {
    var chatItem = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'chat-application-menu', {priority: 35});

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', chatItem);
  }
})();
