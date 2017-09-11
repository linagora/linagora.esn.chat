(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatSummaryDetailsController', chatSummaryDetailsController);

  function chatSummaryDetailsController(session, chatConversationActionsService) {
    var self = this;

    self.displayInformations = false;
    self.toggleDisplayInformation = toggleDisplayInformation;
    self.$onInit = $onInit;

    function $onInit() {
      self.userIsCreator = chatConversationActionsService.currentUserIsCreator(self.conversation);
    }

    function toggleDisplayInformation() {
      self.displayInformations = !self.displayInformations;
    }
  }
})();
