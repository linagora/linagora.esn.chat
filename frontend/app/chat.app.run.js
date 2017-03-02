(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatNotificationService, chatConversationListenerService,
                    chatConversationActionsService, editableOptions,
                    DynamicDirective, dynamicDirectiveService,
                    chatDropdownMenuActionsService, chatBotMessageService,
                    chatBotMessageTextHandler) {
    chatNotificationService.start();
    chatConversationActionsService.start();
    chatConversationListenerService.start();
    editableOptions.theme = 'bs3';

    var chatLeaveConversationActionDynamicDirective = new DynamicDirective(chatDropdownMenuActionsService.canInjectLeaveAction, 'chat-leave-conversation-dropdown-action');
    dynamicDirectiveService.addInjection('chat-conversation-dropdown-actions', chatLeaveConversationActionDynamicDirective);

    var chatAddMembersActionDynamicDirective = new DynamicDirective(chatDropdownMenuActionsService.canInjectAddMembersAction, 'chat-add-members-dropdown-action');
    dynamicDirectiveService.addInjection('chat-conversation-dropdown-actions', chatAddMembersActionDynamicDirective);

    chatBotMessageService.register(chatBotMessageTextHandler.type, chatBotMessageTextHandler.setText);
  }

})();
