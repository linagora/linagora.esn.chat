(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatApplicationMenu', chatApplicationMenu);

  function chatApplicationMenu(applicationMenuTemplateBuilder) {
    var directive = {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'chat', 'Chat')
    };

    return directive;
  }
})();
