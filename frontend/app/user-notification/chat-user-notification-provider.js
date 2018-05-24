(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUserNotificationProvider', chatUserNotificationProvider);

  function chatUserNotificationProvider(
    _,
    $q,
    esnUserNotificationCounter,
    chatUserNotificationService,
    chatConversationService
  ) {
    var notification;

    return {
      name: 'chatUserNotificationProvider',
      getUnreadCount: getUnreadCount,
      list: list,
      updateOnConversationRead: updateOnConversationRead,
      updateOnNewMessageReceived: updateOnNewMessageReceived
    };

    function getUnreadCount() {
      return _getNotification()
        .then(function(userNotification) {
          return userNotification.numberOfUnreadMessages;
        });
    }

    function list(options) {
      return _getNotification()
        .then(function(userNotification) {
          return {
            data: !userNotification.read ? [userNotification].slice(options.offset, options.offset + options.limit) : [] // slice array for paging
          };
        });
    }

    function _getNotification() {
      if (notification) {
        return $q.when(notification);
      }

      return chatUserNotificationService.get()
        .then(function(userNotification) {
          notification = userNotification;

          return notification;
        });
    }

    function updateOnConversationRead(conversationId) {
      if (!notification) {
        return;
      }

      var numberOfUnreadConversations = notification.unreadConversations.length;
      var numberOfReadMessages = 0;

      notification.unreadConversations = notification.unreadConversations.filter(function(conversation) {
        if (conversation._id === conversationId) {
          numberOfReadMessages = conversation.numberOfUnreadMessages;

          return false;
        }

        return true;
      });

      if (notification.unreadConversations.length < numberOfUnreadConversations) {
        notification.numberOfUnreadMessages -= numberOfReadMessages;
        esnUserNotificationCounter.decreaseBy(numberOfReadMessages);
        esnUserNotificationCounter.refresh();

        if (notification.unreadConversations.length === 0) {
          notification.read = true;
        } else {
          notification.timestamps.creation = notification.unreadConversations[0].last_message.date;
          notification.lastUnreadConversationId = notification.unreadConversations[0]._id;
        }
      }
    }

    function updateOnNewMessageReceived(message) {
      var conversation = _.find(notification.unreadConversations, { _id: message.channel });

      if (conversation) {
        notification.unreadConversations = _.sortBy(notification.unreadConversations, function(unreadConversation) {
          return unreadConversation._id === conversation._id ? 0 : 1;
        });

        notification.numberOfUnreadMessages++;
        notification.unreadConversations[0].numberOfUnreadMessages++;
        notification.unreadConversations[0].last_message.date = message.timestamps.creation;
        notification.timestamps.creation = message.timestamps.creation;
        esnUserNotificationCounter.increaseBy(1);
        esnUserNotificationCounter.refresh();
      } else {
        chatConversationService.get(message.channel).then(function(conversation) {
          if (conversation) {
            notification.unreadConversations.unshift({
              _id: conversation._id,
              numberOfUnreadMessages: 1,
              last_message: conversation.last_message
            });
            if (notification.read) {
              notification.read = false;
            }
            notification.timestamps = { creation: conversation.last_message.date };
            notification.lastUnreadConversationId = conversation._id;
            notification.numberOfUnreadMessages++;
            esnUserNotificationCounter.increaseBy(1);
            esnUserNotificationCounter.refresh();
          }
        });
      }
    }
  }
})(angular);
