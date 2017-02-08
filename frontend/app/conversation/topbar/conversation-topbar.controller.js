(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationTopbarController', ChatConversationTopbarController);

  function ChatConversationTopbarController(chatConversationMemberService) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.userIsMember = chatConversationMemberService.currentUserIsMemberOf(self.conversation);
    }
  }
})();
