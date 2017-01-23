(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatFooterController', ChatFooterController);

  function ChatFooterController(CHAT_MEMBER_STATUS) {
    var self = this;

    self.onJoin = onJoin;
    self.$onInit = $onInit;

    function $onInit() {
      self.isMember = self.conversation.member_status === CHAT_MEMBER_STATUS.MEMBER;
    }

    function onJoin() {
      self.isMember = true;
    }
  }
})();
