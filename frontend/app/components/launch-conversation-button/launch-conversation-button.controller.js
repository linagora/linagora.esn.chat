(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatLaunchConversationButtonController', chatLaunchConversationButtonController);

  function chatLaunchConversationButtonController(session) {
    var self = this;

    self.isNotUser = isNotUser;

    if (!self.isCurrentUser) {
      self.isCurrentUser = self.userId === session.user._id;
    }

    function isNotUser() {
      return !!(self.isCurrentUser || self.objectType !== 'user');
    }

  }
})();
