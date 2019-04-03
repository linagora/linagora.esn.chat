(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatApplicationMenu', chatApplicationMenu);

  function chatApplicationMenu(applicationMenuTemplateBuilder, CHAT_MODULE_METADATA) {
    var directive = {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', { url: CHAT_MODULE_METADATA.icon }, 'Chat', 'core.modules.linagora.esn.chat.enabled', false)
    };

    return directive;
  }
})();
