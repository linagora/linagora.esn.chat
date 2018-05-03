(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationActionsService', chatConversationActionsService);

  function chatConversationActionsService(
    $log,
    $q,
    $rootScope,
    $state,
    _,
    session,
    chatConversationNameService,
    chatConversationService,
    chatConversationsStoreService,
    chatMessageUtilsService,
    chatDesktopNotificationService,
    chatPrivateConversationService,
    CHAT_EVENTS,
    CHAT_CONVERSATION_MODE,
    CHAT_CONVERSATION_TYPE
  ) {

    var ready = $q.defer();

    return {
      addConversation: addConversation,
      addConversationWhenCreatorOrConfidential: addConversationWhenCreatorOrConfidential,
      addMember: addMember,
      archiveConversation: archiveConversation,
      createDirectmessageConversation: createDirectmessageConversation,
      createConfidentialConversation: createConfidentialConversation,
      createOpenConversation: createOpenConversation,
      deleteConversation: deleteConversation,
      getConversation: getConversation,
      increaseNumberOfUnreadMessages: increaseNumberOfUnreadMessages,
      joinConversation: joinConversation,
      leaveConversation: leaveConversation,
      markAllMessagesAsRead: markAllMessagesAsRead,
      memberHasBeenAdded: memberHasBeenAdded,
      onMessage: onMessage,
      ready: ready.promise,
      setActive: setActive,
      unsetActive: unsetActive,
      unsubscribePrivateConversation: unsubscribePrivateConversation,
      updateConversation: updateConversation,
      updateConversationTopic: updateConversationTopic,
      updateMembers: updateMembers,
      updateUserMentionsCount: updateUserMentionsCount,
      start: start,
      currentUserIsCreator: currentUserIsCreator
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

      if (currentUserIsCreator(conversation) || conversation.type === CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE) {
        return addConversation(conversation);
      }

      return $q.reject(new Error('Can not add such conversation', conversation));
    }

    function addMember(conversation, userId) {
      if (!conversation) {
        return $q.reject(new Error('Can not add empty conversation'));
      }

      if (!userId) {
        return $q.reject(new Error('Can not add empty member'));
      }

      return chatConversationService.addMember(conversation, userId);
    }

    function archiveConversation(conversationId) {
      if (!conversationId) {
        return $q.reject(new Error('conversationId is required'));
      }

      return chatConversationService.archive(conversationId).then(function(archived) {
        if (!archived) {
          return $q.reject(new Error('could not archive the conversation'));
        }
        chatConversationsStoreService.deleteConversation(conversationId);

        return archived;
      });
    }

    function createDirectmessageConversation(conversation) {
      conversation.type = CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;
      conversation.mode = CHAT_CONVERSATION_MODE.CHANNEL;

      return createConversation(conversation);
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

    function _fetchOpenConversation() {

      return fetchAllConversations()
      .then(function(conversations) {

        return _.filter(conversations, function(conversation) {

          return conversation.type === CHAT_CONVERSATION_TYPE.OPEN;
        });
      });
    }

    function fetchOpenAndSubscribedConversation() {

      return _fetchOpenConversation()
        .then(_calculateUnreadMessage)
        .then(function(openConversations) {
          return chatPrivateConversationService.get().then(function(privateConversations) {
            return openConversations.concat(privateConversations);
          });
        });
    }

    function _calculateUnreadMessage(conversations) {
      return $q.when(conversations.map(function(conversation) {
        var numOfMessage = conversation.numOfMessage;
        var numOfReadedMessage = conversation.numOfReadedMessage[session.user.id];

        conversation.unreadMessageCount = numOfMessage - numOfReadedMessage;

        return conversation;
      }));
    }

    function getConversation(conversationId) {
      var conversation = chatConversationsStoreService.findConversation(conversationId);

      if (conversation) {
        return $q.when(conversation);
      }

      return chatConversationService.get(conversationId);
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

    function memberHasBeenAdded(conversation, member) {
      if (session.user._id !== member.member.id) {
        return;
      }
      chatConversationsStoreService.joinConversation(conversation);

      return chatConversationNameService.getName(conversation)
        .then(notify)
        .catch(function() {
          notify();
        });

      function notify(name) {
        name = name || 'new conversation';
        chatDesktopNotificationService.notify('Welcome to ' + name, {
          body: 'You have been added to the conversation, click to go',
          onClick: function() {
            return $state.go('chat.channels-views', {id: conversation._id});
          }
        });
      }
    }

    function onMessage(type, message) {
      if (chatMessageUtilsService.isMeTyping(message)) {
        $log.debug('Skipping own typing message');

        return;
      }

      // TODO:  The broadcast will be refactored and replaced by actions
      $rootScope.$broadcast(type, message);
      chatDesktopNotificationService.notifyMessage(message);
    }

    function setActive(conversation) {
      chatConversationsStoreService.setActive(conversation);
      $rootScope.$broadcast(CHAT_EVENTS.SET_ACTIVE_ROOM, conversation._id);
    }

    function start() {
      fetchOpenAndSubscribedConversation()
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

    function unsubscribePrivateConversation(conversation) {
      chatConversationsStoreService.unsubscribePrivateConversation(conversation);
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
