(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationActionsService', chatConversationActionsService);

  function chatConversationActionsService($log, $q, $rootScope, _, session, chatConversationService, chatConversationsStoreService, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, CHAT_CONVERSATION_MODE) {
    var ready = $q.defer();

    return {
      addChannel: addChannel,
      addPrivateConversation: addPrivateConversation,
      deleteConversation: deleteConversation,
      getConversation: getConversation,
      increaseNumberOfUnreadMessages: increaseNumberOfUnreadMessages,
      joinConversation: joinConversation,
      leaveConversation: leaveConversation,
      markAllMessagesAsRead: markAllMessagesAsRead,
      ready: ready.promise,
      setActive: setActive,
      unsetActive: unsetActive,
      updateConversation: updateConversation,
      updateConversationTopic: updateConversationTopic,
      updateUserMentionsCount: updateUserMentionsCount,
      start: start
    };

    function addChannel(channel) {
      channel.type = CHAT_CONVERSATION_TYPE.OPEN;
      channel.mode = CHAT_CONVERSATION_MODE.CHANNEL;

      return createConversation(channel);
    }

    function addPrivateConversation(conversation) {
      conversation.type = CHAT_CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.mode = CHAT_CONVERSATION_MODE.CHANNEL;

      return createConversation(conversation);
    }

    function createConversation(conversation) {
      return chatConversationService.create(conversation).then(function(result) {
        var created = result.data;

        $rootScope.$broadcast(CHAT_EVENTS.CONVERSATIONS.NEW, created);
        chatConversationsStoreService.addConversation(created);

        return created;
      });
    }

    function deleteConversation(conversation) {
      return chatConversationService.deleteConversation(conversation._id).then(function() {
        chatConversationsStoreService.deleteConversation(conversation);

        return true;
      });
    }

    function fetchAllConversations() {
      return $q.all({
        conversations: chatConversationService.listForCurrentUser(),
        session: session.ready
      }).then(function(resolved) {
        return resolved.conversations.data;
      });
    }

    function getConversation(conversationId) {
      var conversation = chatConversationsStoreService.findConversation(conversationId);

      if (conversation) {
        return $q.when(conversation);
      }

      return chatConversationService.get(conversationId).then(function(result) {
        conversation = result.data;

        chatConversationsStoreService.addConversation(conversation);

        return conversation;
      });
    }

    function increaseNumberOfUnreadMessages(conversationId) {
      return chatConversationsStoreService.increaseNumberOfUnreadMessages(conversationId);
    }

    function joinConversation(conversation) {
      return chatConversationService.join(conversation._id, session.user._id).then(function() {
        chatConversationsStoreService.joinConversation(conversation);

        return true;
      });
    }

    function leaveConversation(conversation) {
      return chatConversationService.leave(conversation._id, session.user._id).then(function() {
        chatConversationsStoreService.deleteConversation(conversation);

        return true;
      });
    }

    function markAllMessagesAsRead(conversation) {
      return chatConversationService.markAsRead(conversation._id).then(function() {
        chatConversationsStoreService.markAllMessagesAsRead(conversation);

        return true;
      });
    }

    function setActive(conversation) {
      chatConversationsStoreService.setActive(conversation);
      $rootScope.$broadcast(CHAT_EVENTS.SET_ACTIVE_ROOM, conversation._id);
    }

    function start() {
      fetchAllConversations()
        .then(chatConversationsStoreService.addConversations, function(err) {
          $log.error('Can not get user conversations', err);

          return $q.reject(err);
        })
        .finally(function() {
          ready.resolve();
        });
    }

    function unsetActive() {
      chatConversationsStoreService.unsetActive();
      $rootScope.$broadcast(CHAT_EVENTS.UNSET_ACTIVE_ROOM);
    }

    function updateConversation(conversationId, modifications) {
      var body = {
        conversation: conversationId,
        modifications: modifications
      };

      return chatConversationService.update(conversationId, body);
    }

    function updateConversationTopic(conversation, topicValue) {
      return chatConversationService.updateTopic(conversation._id, topicValue).then(function(result) {
        chatConversationsStoreService.updateTopic(result.data, result.data.topic);

        return result.data;
      });
    }

    function updateUserMentionsCount(conversationId, userMentions) {
      if (!userMentions || userMentions.length === 0) {
        return;
      }

      if (_.find(userMentions, {_id: session.user._id})) {
        chatConversationsStoreService.increaseUserMentionsCount(conversationId);
      }
    }
  }
})();
