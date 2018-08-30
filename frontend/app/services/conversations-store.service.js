(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationsStoreService', chatConversationsStoreService);

  function chatConversationsStoreService(
    $log,
    _,
    esnAppStateService,
    chatPrivateConversationService,
    CHAT_CONVERSATION_TYPE,
    CHAT_MEMBER_STATUS
  ) {
    var activeRoom = {};
    var store = {
      addConversation: addConversation,
      addConversations: addConversations,
      channels: [],
      conversations: [],
      deleteConversation: deleteConversation,
      deleteConversations: deleteConversations,
      findConversation: findConversation,
      find: find,
      getNumberOfUnreadMessages: getNumberOfUnreadMessages,
      increaseNumberOfUnreadMessages: increaseNumberOfUnreadMessages,
      increaseUserMentionsCount: increaseUserMentionsCount,
      isActiveRoom: isActiveRoom,
      joinConversation: joinConversation,
      leaveConversation: leaveConversation,
      markAllMessagesAsRead: markAllMessagesAsRead,
      privateConversations: [],
      resetNumberOfUnreadMessages: resetNumberOfUnreadMessages,
      resetNumberOfUnseenMentions: resetNumberOfUnseenMentions,
      setActive: setActive,
      setMembers: setMembers,
      unsetActive: unsetActive,
      unsubscribePrivateConversation: unsubscribePrivateConversation,
      updateConversation: updateConversation,
      updateMembersCount: updateMembersCount,
      updateTopic: updateTopic,
      get activeRoom() {
        return activeRoom;
      }
    };

    return store;

    //////////

    function addConversation(conversation) {
      if (!findConversation(conversation._id)) {
        insertConversationInSortedArray(store.conversations, conversation);
        if (conversation.type === CHAT_CONVERSATION_TYPE.OPEN) {
          insertConversationInSortedArray(store.channels, conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE) {
          insertConversationInSortedArray(store.privateConversations, conversation);
        }
      }
    }

    function _updatePrivateConversations() {
      var privateConversationsIds = store.privateConversations.map(function(privateConversation) {

        return privateConversation._id;
      });

      chatPrivateConversationService.store(privateConversationsIds);
    }

    function addConversations(conversations) {
      conversations && conversations.forEach(function(conversation) {
        addConversation(conversation);
      });
    }

    function deleteConversation(conversation) {
      var array = [];

      conversation = !conversation._id ? _.find(store.conversations, {_id: conversation}) : conversation;

      if (!conversation) {
        return $log.warn('Trying to delete a conversation that does not exist');
      }

      if (conversation.type === CHAT_CONVERSATION_TYPE.OPEN) {
        array = store.channels;
      } else if (conversation.type === CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE) {
        array = store.privateConversations;
      }

      _.remove(array, {_id: conversation._id});
      _.remove(store.conversations, {_id: conversation._id});
    }

    function deleteConversations(conversations) {
      conversations && conversations.forEach(function(conversation) {
        deleteConversation(conversation);
      });
    }

    function findConversation(conversationId) {
      return _.find(store.conversations, {_id: conversationId});
    }

    function find(filter) {
      return _.find(store.conversations, filter);
    }

    function getNumberOfUnreadMessages() {
      var unreadedMessages = 0;

      store.conversations.forEach(function(conversation) {
        unreadedMessages = unreadedMessages + (conversation.unreadMessageCount || 0);
      });

      return unreadedMessages;
    }

    function resetNumberOfUnreadMessages(conversationId) {
      var conversation = _.find(store.conversations, function(conversation) {
        return conversation._id === conversationId;
      });

      if (conversation) {
        conversation.unreadMessageCount = 0;
      }
    }

    function resetNumberOfUnseenMentions(conversationId) {
      var conversation = _.find(store.conversations, function(conversation) {
        return conversation._id === conversationId;
      });

      if (conversation) {
        conversation.mention_count = 0;
      }
    }

    function insertConversationInSortedArray(array, conversation) {
      var index = _.sortedIndex(array, conversation, function(conversation) {
        return conversation.name.toLowerCase();
      });

      array.splice(index, 0, conversation);
    }

    function increaseNumberOfUnreadMessages(conversationId) {
      if (!conversationId) {
        return $log.warn('conversationID is needed to update conversation number of unreaded messages.');
      }

      var conversation = findConversation(conversationId);

      if (conversation && !(isActiveRoom(conversation._id) && esnAppStateService.isForeground())) {
        conversation.unreadMessageCount = (conversation.unreadMessageCount || 0) + 1;
      }
    }

    function increaseUserMentionsCount(conversationId) {
      if (!conversationId) {
        return $log.warn('conversationID is needed to update conversation number of user mentions');
      }

      var conversation = findConversation(conversationId);

      if (conversation && !isActiveRoom(conversation._id)) {
        conversation.mention_count = (conversation.mention_count || 0) + 1;
      }
    }

    function isActiveRoom(conversationId) {
      if (!conversationId) {
        return false;
      }

      return conversationId === activeRoom._id;
    }

    function joinConversation(conversation) {
      if (!conversation) {
        return;
      }
      conversation.member_status = CHAT_MEMBER_STATUS.MEMBER;

      return addConversation(conversation);
    }

    function leaveConversation(conversation) {
      return deleteConversation(conversation);
    }

    function markAllMessagesAsRead(conversation) {
      var conv = findConversation(conversation._id);

      if (conv) {
        conv.unreadMessageCount = 0;
      }
    }

    function setActive(conversation) {
      if (!conversation) {
        return false;
      }

      if (isActiveRoom(conversation._id)) {
        return true;
      }

      conversation = findConversation(conversation._id) || conversation;
      conversation.mention_count = 0;
      conversation.unreadMessageCount = 0;
      activeRoom = conversation;

      return true;
    }

    function setMembers(conversation, members) {
      var conv = findConversation(conversation._id);

      if (!conv) {
        return;
      }

      conv.members = members;
    }

    function unsetActive() {
      activeRoom = {};
    }

    function updateConversation(conversation) {
      var conv = findConversation(conversation._id);

      if (!conv) {
        addConversation(conversation);

        return;
      }

      conv.name = conversation.name;
      conv.members = conversation.members;
      conv.avatar = conversation.avatar;
    }

    function unsubscribePrivateConversation(conversation) {
      conversation = !conversation._id ? _.find(store.conversations, {_id: conversation}) : conversation;

      if (!conversation) {

        return $log.warn('Trying to unsubscribe from a conversation that does not exist');
      }
      _.remove(store.privateConversations, {_id: conversation._id});
      _.remove(store.conversations, {_id: conversation._id});
      _updatePrivateConversations();
    }

    function updateMembersCount(conversation, count) {
      var conv = findConversation(conversation._id);

      if (!conv) {
        return;
      }

      conv.members_count = count;
    }

    function updateTopic(conversation, topic) {
      var conv = findConversation(conversation._id);

      if (!conv) {
        return;
      }

      conv.topic = topic;
    }
  }
})();
