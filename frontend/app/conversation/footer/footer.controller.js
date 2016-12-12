(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatFooterController', ChatFooterController);

  function ChatFooterController(_, session) {
    var self = this;

    self.onJoin = onJoin;
    self.$onInit = $onInit;

    function $onInit() {
      self.isMember = !!_.find(self.conversation.members, {_id: session.user._id});
    }

    function onJoin() {
      self.isMember = true;
    }
  }
})();
