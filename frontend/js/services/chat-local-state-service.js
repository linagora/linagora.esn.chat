'use strict';

angular.module('linagora.esn.chat')

  .factory('chatLocalStateService', function($rootScope, $q, _, session, livenotification, conversationsService, chatParseMention, CHAT_CONVERSATION_TYPE, CHAT_EVENTS, CHAT_NAMESPACE) {
    var service;

    function initLocalState() {
      conversationsService.getConversations().then(function(conversations) {
        conversations.forEach(function(conversation) {
          addConversation(conversation);
        });
      });
      service.activeRoom = {};

      var sio = livenotification(CHAT_NAMESPACE);
      sio.on(CHAT_EVENTS.NEW_CONVERSATION, addConversation);

      $rootScope.$on(CHAT_EVENTS.CONVERSATIONS.NEW, function(event, data) {
        addConversation(data);
      });

      $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        var conversation = findConversation(message.channel);

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

    function findConversation(channelId) {
      return _.find(service.conversations, {_id: channelId});
    }

    function isActiveRoom(channelId) {
      return channelId === service.activeRoom._id;
    }

    function setActive(channelId) {
      var channel;
      if (isActiveRoom(channelId)) {
        return true;
      }
      channel = findConversation(channelId);
      if (!channel) {
        return false;
      }
      channel.unreadMessageCount = 0;
      channel.mentionCount = 0;
      service.activeRoom = channel;

      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channel);

      return true;
    }

    function unreadMessage(message) {
      var channel = findConversation(message.channel);
      if (channel && !isActiveRoom(channel._id)) {
        channel.unreadMessageCount = (channel.unreadMessageCount || 0) + 1;
        if (chatParseMention.userIsMentioned(message.text, session.user)) {
          channel.mentionCount = (channel.mentionCount || 0) + 1;
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

    service = {
      setActive: setActive,
      unreadMessage: unreadMessage,
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
