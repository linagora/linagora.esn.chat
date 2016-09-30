(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatApplicationMenu', chatApplicationMenu);

  function chatApplicationMenu(applicationMenuTemplateBuilder) {
    var directive = {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };

    return directive;
  }
})();
