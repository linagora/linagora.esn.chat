(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatMessageViewController', ChatMessageViewController);

  function ChatMessageViewController(CHAT_MEMBER_STATUS) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.isMember = self.conversation.member_status === CHAT_MEMBER_STATUS.MEMBER;
    }
  }
})();
