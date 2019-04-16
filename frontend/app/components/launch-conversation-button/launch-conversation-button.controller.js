(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatLaunchConversationButtonController', chatLaunchConversationButtonController);

  function chatLaunchConversationButtonController(session) {
    var self = this;
    self.isCurrentUser = self.userId === session.user._id;
  }
})();
