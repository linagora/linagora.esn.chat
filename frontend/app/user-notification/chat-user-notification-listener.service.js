(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUserNotificationListenerService', chatUserNotificationListenerService);

  function chatUserNotificationListenerService(
    _,
    $rootScope,
    chatConversationsStoreService,
    chatUserNotificationProvider,
    esnAppStateService,
    CHAT_EVENTS
  ) {
    return {
      start: start
    };

    function memberHasRead(event, data) {
      chatUserNotificationProvider.updateOnConversationRead(data.conversationId);
    }

    function onMessage(message) {
      if (!(esnAppStateService.isForeground() && chatConversationsStoreService.isActiveRoom(message.channel))) {
        chatUserNotificationProvider.updateOnNewMessageReceived(message);
      }
    }

    function start() {
      $rootScope.$on(CHAT_EVENTS.MEMBER_READ_CONVERSATION, memberHasRead);

      [CHAT_EVENTS.BOT_MESSAGE, CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(messageEvent) {
        $rootScope.$on(messageEvent, function(event, message) {
          onMessage(message);
        });
      });
    }
  }
})(angular);
