(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationActionsService', chatConversationActionsService);

  function chatConversationActionsService($log, $q, $rootScope, _, session, chatConversationService, chatConversationsStoreService, chatConversationNameService, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, CHAT_CONVERSATION_MODE) {
    var ready = $q.defer();

    return {
      addConversation: addConversation,
      addConversationWhenCreatorOrConfidential: addConversationWhenCreatorOrConfidential,
      createConfidentialConversation: createConfidentialConversation,
      createOpenConversation: createOpenConversation,
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
      updateMembers: updateMembers,
      updateUserMentionsCount: updateUserMentionsCount,
      start: start
    };

    function addConversation(conversation) {
      if (!conversation) {
        return $q.reject(new Error('Can not add empty conversation'));
      }

      return chatConversationNameService.getName(conversation).then(function(name) {
        conversation.name = name;
        chatConversationsStoreService.addConversation(conversation);

        return conversation;
      });
    }

    function addConversations(conversations) {
      return $q.all(conversations.map(addConversation));
    }

    function addConversationWhenCreatorOrConfidential(conversation) {
      if (!conversation) {
        return $q.reject(new Error('Can not add empty conversation'));
      }

      if (currentUserIsCreator(conversation) || conversation.type === CHAT_CONVERSATION_TYPE.CONFIDENTIAL) {
        return addConversation(conversation);
      }

      return $q.reject(new Error('Can not add such conversation', conversation));
    }

    function createConfidentialConversation(conversation) {
      conversation.type = CHAT_CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.mode = CHAT_CONVERSATION_MODE.CHANNEL;

      return createConversation(conversation);
    }

    function createOpenConversation(conversation) {
      conversation.type = CHAT_CONVERSATION_TYPE.OPEN;
      conversation.mode = CHAT_CONVERSATION_MODE.CHANNEL;

      return createConversation(conversation);
    }

    function createConversation(conversation) {
      return chatConversationService.create(conversation).then(function(result) {
        return addConversation(result.data);
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

        conversation && chatConversationsStoreService.addConversation(conversation);

        return conversation;
      });
    }

    function increaseNumberOfUnreadMessages(conversationId) {
      return chatConversationsStoreService.increaseNumberOfUnreadMessages(conversationId);
    }

    function currentUserIsCreator(conversation) {
      return session.user._id === conversation.creator._id || session.user._id === conversation.creator;
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
        .then(addConversations, function(err) {
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

    function updateMembers(conversation, count) {
      if (conversation.type === CHAT_CONVERSATION_TYPE.CONFIDENTIAL && conversation.members) {
        chatConversationsStoreService.setMembers(conversation, conversation.members);
      }

      if (count) {
        chatConversationsStoreService.updateMembersCount(conversation, count);
      }
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
