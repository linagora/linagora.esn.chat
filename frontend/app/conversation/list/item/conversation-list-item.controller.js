(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationListItemController', ChatConversationListItemController);

  function ChatConversationListItemController($state, CHAT_MEMBER_STATUS) {
    var self = this;

    self.onJoin = onJoin;
    self.$onInit = $onInit;

    function $onInit() {
      self.isMember = self.conversation.member_status === CHAT_MEMBER_STATUS.MEMBER;
    }

    function onJoin() {
      $state.go('chat.channels-views', {id: self.conversation._id});
    }
  }
})();
