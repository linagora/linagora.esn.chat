(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatSummaryAttachmentsController', chatSummaryAttachmentsController);

  function chatSummaryAttachmentsController() {
    var self = this;

    self.displayAttachments = false;
    self.toggleDisplayAttachment = toggleDisplayAttachment;

    function toggleDisplayAttachment() {
      self.displayAttachments = !self.displayAttachments;
    }

  }
})();
