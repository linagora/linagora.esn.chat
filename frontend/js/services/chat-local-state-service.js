'use strict';

angular.module('linagora.esn.chat')

  .factory('chatLocalStateService', function($rootScope, $q, $log, _, session, livenotification, conversationsService, chatParseMention, CHAT_CONVERSATION_TYPE, CHAT_EVENTS, CHAT_NAMESPACE) {
    var service;

    function initLocalState() {
      conversationsService.getConversations().then(function(conversations) {
        conversations.forEach(function(conversation) {
          addConversation(conversation);
        });
      }, function(err) {
        $log.error('Error while getting conversations', err);
      });
      service.activeRoom = {};

      var sio = livenotification(CHAT_NAMESPACE);
      sio.on(CHAT_EVENTS.NEW_CONVERSATION, addConversation);

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

        conversation.last_message = {
          text: message.text,
          date: message.timestamps.creation
        };
        conversation.last_message.date = message.timestamps.creation;
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

    function isActiveRoom(conversationId) {
      return conversationId === service.activeRoom._id;
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
      service.activeRoom = conversation;

      conversationsService.markAllMessageReaded(conversation._id);
      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, conversation);

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

    function replaceConversationInSortedArray(array, conv) {
      _.remove(array, {_id: conv._id});
      insertConversationInSortedArray(array, conv);
    }

    function unsetActive() {
      service.activeRoom = {};
    }

    service = {
      setActive: setActive,
      unsetActive: unsetActive,
      initLocalState: initLocalState,
      findConversation: findConversation,
      isActiveRoom: isActiveRoom,
      addConversation: addConversation,
      channels: [],
      privateConversations: [],
      communityConversations: [],
      conversations: [],
      activeRoom: {}
    };

    return service;
  });
