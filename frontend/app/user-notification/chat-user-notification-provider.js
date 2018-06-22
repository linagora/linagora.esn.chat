(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUserNotificationProvider', chatUserNotificationProvider);

  function chatUserNotificationProvider(
    _,
    $q,
    session,
    esnUserNotificationState,
    chatUserNotificationService,
    chatConversationMemberService,
    chatConversationService
  ) {
    var notification;

    return {
      name: 'chatUserNotificationProvider',
      getNumberOfImportantNotifications: getNumberOfImportantNotifications,
      getUnreadCount: getUnreadCount,
      list: list,
      updateOnConversationRead: updateOnConversationRead,
      updateOnNewMessageReceived: updateOnNewMessageReceived
    };

    function getNumberOfImportantNotifications() {
      return _getNotification()
        .then(function(userNotification) {
          return userNotification.numberOfUnseenMentions;
        });
    }

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
      if (!notification || notification.read) {
        return;
      }

      var readConversation;

      notification.unreadConversations = notification.unreadConversations.filter(function(conversation) {
        if (conversation._id === conversationId) {
          readConversation = conversation;

          return false;
        }

        return true;
      });

      if (!readConversation) {
        return;
      }

      var numberOfReadMessages;
      var numberOfSeenMentions;

      if (notification.unreadConversations.length === 0) {
        numberOfReadMessages = notification.numberOfUnreadMessages;
        numberOfSeenMentions = notification.numberOfUnseenMentions;
        notification.read = true;
      } else {
        numberOfReadMessages = readConversation.numberOfUnreadMessages;
        numberOfSeenMentions = readConversation.numberOfUnseenMentions;
        notification.timestamps.creation = notification.unreadConversations[0].last_message.date;
        notification.lastUnreadConversationId = notification.unreadConversations[0]._id;
      }

      notification.numberOfUnreadMessages -= numberOfReadMessages;
      notification.numberOfUnseenMentions -= numberOfSeenMentions;
      esnUserNotificationState.decreaseCountBy(numberOfReadMessages);
      esnUserNotificationState.decreaseNumberOfImportantNotificationsBy(numberOfSeenMentions);
      esnUserNotificationState.refresh();
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
        esnUserNotificationState.increaseCountBy(1);

        if (_isUserMentionedInMessage(session.user._id, message)) {
          notification.numberOfUnseenMentions++;
          notification.unreadConversations[0].numberOfUnseenMentions++;
          esnUserNotificationState.increaseNumberOfImportantNotificationsBy(1);
        }

        esnUserNotificationState.refresh();
      } else {
        chatConversationService.get(message.channel).then(function(conversation) {
          if (!conversation || !chatConversationMemberService.currentUserIsMemberOf(conversation)) {
            return;
          }

          var newUnreadConversation = {
            _id: conversation._id,
            numberOfUnreadMessages: 1,
            numberOfUnseenMentions: 0,
            last_message: conversation.last_message
          };

          if (notification.read) {
            notification.read = false;
          }
          notification.timestamps = { creation: conversation.last_message.date };
          notification.lastUnreadConversationId = conversation._id;
          notification.numberOfUnreadMessages++;
          esnUserNotificationState.increaseCountBy(1);

          if (_isUserMentionedInMessage(session.user._id, message)) {
            newUnreadConversation.numberOfUnseenMentions = 1;
            notification.numberOfUnseenMentions++;
            esnUserNotificationState.increaseNumberOfImportantNotificationsBy(1);
          }

          notification.unreadConversations.unshift(newUnreadConversation);
          esnUserNotificationState.refresh();
        });
      }
    }

    function _isUserMentionedInMessage(userId, message) {
      return _.find(message.user_mentions, { _id: userId });
    }
  }
})(angular);
