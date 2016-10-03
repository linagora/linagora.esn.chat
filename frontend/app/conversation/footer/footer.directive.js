(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatFooter', chatFooter);

  function chatFooter() {
    var directive = {
      restrict: 'E',
      templateUrl: '/chat/app/conversation/footer/footer.html'
    };

    return directive;
  }
})();
