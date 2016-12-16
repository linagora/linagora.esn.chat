(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatFileUpload', chatFileUpload);

    function chatFileUpload() {
      var directive = {
        restrict: 'A',
        controller: 'chatFileUploadController',
        controllerAs: 'ctrl'
      };

      return directive;
    }
})();
