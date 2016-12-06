(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatScrollService', chatScrollService);

    chatScrollService.$inject = ['elementScrollService'];

    function chatScrollService(elementScrollService) {

      return {
        scrollDown: scrollDown
      };

      function scrollDown() {
        elementScrollService.autoScrollDown($('.ms-body .lv-body'));
      }
    }
})();
