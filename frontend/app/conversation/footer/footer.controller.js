(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatFooterController', ChatFooterController);

  function ChatFooterController(_, session) {
    var self = this;

    self.isMember = !!_.find(self.conversation.members, {_id: session.user._id});
    self.onJoin = onJoin;

    function onJoin() {
      self.isMember = true;
    }
  }
})();
