(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatFileUploadDragOver', chatFileUploadDragOver());

  function chatFileUploadDragOver() {
    var component = {
      templateUrl: '/chat/app/conversation/file-upload/drag-over/drag-over.html'
    };

    return component;
  }
})();
