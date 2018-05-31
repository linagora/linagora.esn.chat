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
        var memberStates = _getMemberStateFromConversation(session.user._id, unreadConversation);

        return {
          _id: unreadConversation._id,
          numberOfUnreadMessages: unreadConversation.numOfMessage - memberStates.numberOfReadMessages,
          numberOfUnseenMentions: memberStates.numberOfUnseenMentions,
          last_message: unreadConversation.last_message
        };
      });

      var unreadNotification = {
        category: CHAT_USER_NOTIFICATION_CATEGORIES.unread,
        read: unreadConversations.length === 0,
        numberOfUnreadMessages: 0,
        numberOfUnseenMentions: 0,
        unreadConversations: unreadConversations
      };

      if (unreadConversations.length > 0) {
        unreadNotification.timestamps = { creation: unreadConversations[0].last_message.date };
        unreadNotification.lastUnreadConversationId = unreadConversations[0]._id;
        unreadConversations.forEach(function(unreadConversation) {
          unreadNotification.numberOfUnreadMessages += unreadConversation.numberOfUnreadMessages;
          unreadNotification.numberOfUnseenMentions += unreadConversation.numberOfUnseenMentions;
        });
      }

      return unreadNotification;
    }

    function _getMemberStateFromConversation(userId, conversation) {
      if (!conversation.memberStates || !conversation.memberStates[String(userId)]) {
        return {
          numberOfReadMessages: 0,
          numberOfUnseenMentions: 0
        };
      }

      return {
        numberOfReadMessages: conversation.memberStates[String(userId)].numOfReadMessages || 0,
        numberOfUnseenMentions: conversation.memberStates[String(userId)].numOfUnseenMentions || 0
      };
    }

    function _sortByLastMessageDate(conversation1, conversation2) {
      return new Date(conversation2.last_message.date) - new Date(conversation1.last_message.date);
    }
  }
})(angular);
