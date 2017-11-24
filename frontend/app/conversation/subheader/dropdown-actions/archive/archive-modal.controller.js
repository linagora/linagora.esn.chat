(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatArchiveModalController', ChatArchiveModalController);

  function ChatArchiveModalController($state, chatConversationsStoreService, chatConversationActionsService) {
    var self = this;

    self.archive = archive;

    function archive() {
      var defaultChannel = chatConversationsStoreService.channels[0];

      chatConversationActionsService.archiveConversation(chatConversationsStoreService.activeRoom._id).then(function() {
        $state.go('chat.channels-views', { id: defaultChannel._id});
      });
    }
  }
})();
