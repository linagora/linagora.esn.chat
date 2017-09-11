(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatSummaryMembersController', chatSummaryMembersController);

  function chatSummaryMembersController() {
    var self = this;

    self.displayMembers = false;
    self.toggleDisplayMembers = toggleDisplayMembers;

    function toggleDisplayMembers() {
      self.displayMembers = !self.displayMembers;
    }

  }
})();
