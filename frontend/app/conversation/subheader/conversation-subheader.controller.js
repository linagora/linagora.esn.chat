(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationSubheaderController', ChatConversationSubheaderController);

  function ChatConversationSubheaderController($stateParams, chatConversationsStoreService, chatConversationNameService, chatDropdownMenuActionsService) {
    var self = this;

    self.chatConversationsStoreService = chatConversationsStoreService;
    self.$onInit = $onInit;
    self.chatDropdownMenuActionsService = chatDropdownMenuActionsService;

    function $onInit() {
      chatConversationNameService.getName(chatConversationsStoreService.findConversation($stateParams.id)).then(function(name) {
        self.name = name;
        self.canInjectAddMembersAction = chatDropdownMenuActionsService.canInjectAddMembersAction();
        self.canInjectLeaveAction = chatDropdownMenuActionsService.canInjectLeaveAction();
        self.canInjectArchiveAction = chatDropdownMenuActionsService.canInjectArchiveAction();
      });
    }
  }
})();
