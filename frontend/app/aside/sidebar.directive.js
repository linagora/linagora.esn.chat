(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatSidebar', chatSidebar);

  chatSidebar.$inject = ['chatNotificationService'];

  function chatSidebar(chatNotificationService) {
    var directive = {
      restrict: 'E',
      templateUrl: '/chat/app/aside/sidebar.html',
      link: link
    };

    return directive;

    function link(scope) {
      scope.toggleNotification = function() {
        var enable = chatNotificationService.isEnabled();

        chatNotificationService.setNotificationStatus(!enable);
        scope.isNotificationEnabled = !enable;
      };
    }
  }
})();
