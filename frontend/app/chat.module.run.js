(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(chatDesktopNotificationService, chatConversationListenerService,
                    chatConversationActionsService, editableOptions,
                    DynamicDirective, dynamicDirectiveService,
                    chatDropdownMenuActionsService, chatBotMessageService,
                    chatBotMessageTextHandler, chatBotMessageNotMemberMentionHandler,
                    esnModuleRegistry, esnScrollListenerService,
                    CHAT_MODULE_METADATA) {
    chatDesktopNotificationService.start();
    chatConversationActionsService.start();
    chatConversationListenerService.start();
    editableOptions.theme = 'bs3';

    var chatLeaveConversationActionDynamicDirective = new DynamicDirective(chatDropdownMenuActionsService.canInjectLeaveAction, 'chat-leave-conversation-dropdown-action');
    var chatAddMembersActionDynamicDirective = new DynamicDirective(chatDropdownMenuActionsService.canInjectAddMembersAction, 'chat-add-members-dropdown-action');

    dynamicDirectiveService.addInjection('chat-conversation-dropdown-actions', chatLeaveConversationActionDynamicDirective);
    dynamicDirectiveService.addInjection('chat-conversation-dropdown-actions', chatAddMembersActionDynamicDirective);
    chatBotMessageService.register(chatBotMessageTextHandler.type, chatBotMessageTextHandler.setText);
    chatBotMessageService.register(chatBotMessageNotMemberMentionHandler.type, chatBotMessageNotMemberMentionHandler.setText);
    esnModuleRegistry.add(CHAT_MODULE_METADATA);
    esnScrollListenerService.bindTo('.chat-messages-main .lv-body');
  }

})();
