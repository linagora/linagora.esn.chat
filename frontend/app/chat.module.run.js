(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(
    chatDesktopNotificationService,
    chatConversationListenerService,
    chatConversationActionsService,
    editableOptions,
    chatBotMessageService,
    chatConversationService,
    chatBotMessageTextHandler,
    chatBotMessageNotMemberMentionHandler,
    esnModuleRegistry,
    esnScrollListenerService,
    objectTypeResolver,
    CHAT_OBJECT_TYPES,
    CHAT_MODULE_METADATA
  ) {
    chatDesktopNotificationService.start();
    chatConversationActionsService.start();
    chatConversationListenerService.start();
    editableOptions.theme = 'bs3';

    chatBotMessageService.register(chatBotMessageTextHandler.type, chatBotMessageTextHandler.setText);
    chatBotMessageService.register(chatBotMessageNotMemberMentionHandler.type, chatBotMessageNotMemberMentionHandler.setText);
    esnModuleRegistry.add(CHAT_MODULE_METADATA);
    objectTypeResolver.register(CHAT_OBJECT_TYPES.CONVERSATION, chatConversationService.get);
    esnScrollListenerService.bindTo('.chat-messages-main .lv-body');
  }

})();
