(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUserNotificationService', chatUserNotificationService);

  function chatUserNotificationService(
    session,
    chatConversationService,
    ChatUserNotification,
    CHAT_USER_NOTIFICATION_CATEGORIES
  ) {

    return {
      get: get
    };

    function get() {
      return chatConversationService.listForCurrentUser({ unread: true })
        .then(function(result) {
          var unreadNotification = _buildUnreadNotification(result.data);

          return new ChatUserNotification(unreadNotification);
        });
    }

    function _buildUnreadNotification(unreadConversations) {
      unreadConversations = unreadConversations.sort(_sortByLastMessageDate).map(function(unreadConversation) {
        return {
          _id: unreadConversation._id,
          numberOfUnreadMessages: unreadConversation.numOfMessage - unreadConversation.memberStates[String(session.user._id)].numOfReadMessages,
          last_message: unreadConversation.last_message
        };
      });

      var unreadNotification = {
        category: CHAT_USER_NOTIFICATION_CATEGORIES.unread,
        read: unreadConversations.length === 0,
        numberOfUnreadMessages: 0,
        unreadConversations: unreadConversations
      };

      if (unreadConversations.length > 0) {
        unreadNotification.timestamps = { creation: unreadConversations[0].last_message.date };
        unreadNotification.lastUnreadConversationId = unreadConversations[0]._id;
        unreadConversations.forEach(function(unreadConversation) {
          unreadNotification.numberOfUnreadMessages += unreadConversation.numberOfUnreadMessages;
        });
      }

      return unreadNotification;
    }

    function _sortByLastMessageDate(conversation1, conversation2) {
      return new Date(conversation2.last_message.date) - new Date(conversation1.last_message.date);
    }
  }
})(angular);
