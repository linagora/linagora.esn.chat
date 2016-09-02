'use strict';

angular.module('linagora.esn.chat')

  .factory('chatLocalStateService', function($rootScope, $q, $log, _, session, livenotification, conversationsService, chatParseMention, CHAT_CONVERSATION_TYPE, CHAT_EVENTS, CHAT_NAMESPACE) {
    var service;

    var deferred = $q.defer();

    var activeRoom = {};

    function initLocalState() {
      conversationsService.resetCache();
      service.channels = [];
      service.privateConversations = [];
      service.conversations = [];
      service.communityConversations = [];
      activeRoom = {};

      conversationsService.getConversations().then(function(conversations) {
        conversations.forEach(function(conversation) {
          addConversation(conversation);
        });

        deferred.resolve();
      }, function(err) {
        $log.error('Error while getting conversations', err);
      });
      activeRoom = {};

      var sio = livenotification(CHAT_NAMESPACE);
      sio.on(CHAT_EVENTS.NEW_CONVERSATION, addConversation);
      sio.on(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversationInCache);
      sio.on(CHAT_EVENTS.CONVERSATIONS.ADD_NEW_MEMBERS, function(conversation) {
        var conv = findConversation(conversation._id);
        if (!conv) {
          addConversation(conversation);
          return;
        }
        conv.members = conversation.members;
      });

      sio.on(CHAT_EVENTS.CONVERSATIONS.UPDATE, function(conversation) {
        var conv = findConversation(conversation._id);
        if (!conv) {
          addConversation(conversation);
          return;
        }

        conv.name = conversation.name;
        conv.members = conversation.members;

        $rootScope.$broadcast(CHAT_EVENTS.CONVERSATIONS.UPDATE, conv);
      });

      $rootScope.$on(CHAT_EVENTS.CONVERSATIONS.NEW, function(event, data) {
        addConversation(data);
      });

      $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        var conversation = findConversation(message.channel);
        if (!conversation) {
          return;
        }

        unreadMessage(message);

        if (isActiveRoom(conversation._id)) {
          conversationsService.markAllMessageReaded(conversation._id);
        }

        var parsedText = chatParseMention.chatParseMention(message.text, message.user_mentions, {skipLink: true});

        conversation.last_message = {
          text: parsedText,
          date: message.timestamps.creation,
          creator: message.creator,
          user_mentions: message.user_mentions
        };

        replaceConversationInSortedArray(service.conversations, conversation);

        if (conversation.type === CHAT_CONVERSATION_TYPE.CHANNEL) {
          replaceConversationInSortedArray(service.channels, conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.PRIVATE) {
          replaceConversationInSortedArray(service.privateConversations, conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.COMMUNITY) {
          replaceConversationInSortedArray(service.communityConversations, conversation);
        }
      });
    }

    function findConversation(conversationId) {
      return _.find(service.conversations, {_id: conversationId});
    }

    function find(filter) {
      return _.find(service.conversations, filter);
    }

    function isActiveRoom(conversationId) {
      return conversationId === activeRoom._id;
    }

    function setActive(conversationId) {
      var conversation;
      if (isActiveRoom(conversationId)) {
        return true;
      }
      conversation = findConversation(conversationId);
      if (!conversation) {
        return false;
      }
      conversation.unreadMessageCount = 0;
      conversation.mentionCount = 0;
      activeRoom = conversation;

      conversationsService.markAllMessageReaded(conversation._id);
      $rootScope.$broadcast(CHAT_EVENTS.SET_ACTIVE_ROOM, conversation);

      return true;
    }

    function unreadMessage(message) {
      var conversation = findConversation(message.channel);
      if (conversation && !isActiveRoom(conversation._id)) {
        conversation.unreadMessageCount = (conversation.unreadMessageCount || 0) + 1;
        if (chatParseMention.userIsMentioned(message.text, session.user)) {
          conversation.mentionCount = (conversation.mentionCount || 0) + 1;
        }
      }
    }

    function getNumberOfUnreadedMessages() {
      var unreadedMessages = 0;
      service.conversations.forEach(function(conversation) {
        unreadedMessages = unreadedMessages + conversation.unreadMessageCount;
      });

      return unreadedMessages;
    }

    function insertConversationInSortedArray(array, conversation) {
      var index = _.sortedIndex(array, conversation, function(conversation) {
        if (!conversation.last_message || !conversation.last_message.date) {
          return -(new Date());
        }
        return -(new Date(conversation.last_message.date));
      });

      array.splice(index, 0, conversation);
    }

    function addConversation(conversation) {
      if (!findConversation(conversation._id)) {
        insertConversationInSortedArray(service.conversations, conversation);
        session.ready.then(function(session) {
          conversation.unreadMessageCount = (conversation.numOfMessage  || 0) - ((conversation.numOfReadedMessage || {})[session.user._id] || 0);
        });
        if (conversation.type === CHAT_CONVERSATION_TYPE.CHANNEL) {
          insertConversationInSortedArray(service.channels, conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.PRIVATE) {
          insertConversationInSortedArray(service.privateConversations, conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.COMMUNITY) {
          insertConversationInSortedArray(service.communityConversations, conversation);
        }
      }
    }

    function deleteConversationInCache(conv) {
      var array = [];
      var conversation = !conv._id ? _.find(service.conversations, {_id: conv}) : conv;
      if (!conversation) {
        $log.warn('Trying to delete a conversation that does not exist', conv);
        return;
      }
      if (conversation.type === CHAT_CONVERSATION_TYPE.CHANNEL) {
        array = service.channels;
      } else if (conversation.type === CHAT_CONVERSATION_TYPE.PRIVATE) {
        array = service.privateConversations;
      } else if (conversation.type === CHAT_CONVERSATION_TYPE.COMMUNITY) {
        array = service.communityConversations;
      }

      _.remove(array, {_id: conversation._id});
      _.remove(service.conversations, {_id: conversation._id});
    }

    function deleteConversation(conversation) {
      return conversationsService.deleteConversation(conversation._id).then(function() {
        deleteConversationInCache(conversation);
      });
    }

    function leaveConversation(conversation) {
      return conversationsService.leaveConversation(conversation._id).then(function() {
        deleteConversationInCache(conversation);
      });
    }

    function replaceConversationInSortedArray(array, conv) {
      _.remove(array, {_id: conv._id});
      insertConversationInSortedArray(array, conv);
    }

    function unsetActive() {
      activeRoom = {};
      $rootScope.$broadcast(CHAT_EVENTS.UNSET_ACTIVE_ROOM);
    }

    service = {
      setActive: setActive,
      ready: deferred.promise,
      unsetActive: unsetActive,
      initLocalState: initLocalState,
      find: find,
      findConversation: findConversation,
      isActiveRoom: isActiveRoom,
      getNumberOfUnreadedMessages: getNumberOfUnreadedMessages,
      addConversation: addConversation,
      deleteConversation: deleteConversation,
      leaveConversation: leaveConversation,
      channels: [],
      privateConversations: [],
      communityConversations: [],
      conversations: [],
      get activeRoom() {
        return activeRoom;
      }
    };

    return service;
  });
