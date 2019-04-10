(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(
    session,
    esnUserNotificationService,
    chatUserNotificationProvider,
    chatUserNotificationListenerService,
    esnUserNotificationTemplateProviderRegistry,
    chatConfiguration,
    CHAT_USER_NOTIFICATION_CATEGORIES
  ) {
    chatConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      session.ready.then(function() {
        esnUserNotificationService.addProvider(chatUserNotificationProvider);
        esnUserNotificationTemplateProviderRegistry.add({
          template: 'chat-user-notification-template-unread',
          category: CHAT_USER_NOTIFICATION_CATEGORIES.unread,
          forceClosePopoverOnClick: true
        });
        chatUserNotificationListenerService.start();
      });
    });
  }
})(angular);
