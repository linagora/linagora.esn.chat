'use strict';

angular.module('linagora.esn.chat')

  .factory('chatLocalStateService', function($rootScope, $q, _, session, conversationsService, chatParseMention, CHAT_CONVERSATION_TYPE, CHAT_EVENTS) {
    var service;

    function initLocalState() {
      conversationsService.getConversations().then(function(conversations) {
        conversations.forEach(function(conversation) {
          addConversation(conversation);
        });
      });
      service.activeRoom = {};
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

    function addConversation(conversation) {
      if (!findConversation(conversation._id)) {
        service.conversations.push(conversation);

        if (conversation.type === CHAT_CONVERSATION_TYPE.CHANNEL) {
          service.channels.push(conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.PRIVATE) {
          service.privateConversations.push(conversation);
        } else if (conversation.type === CHAT_CONVERSATION_TYPE.COMMUNITY) {
          service.communityConversations.push(conversation);
        }
      }
    }

    $rootScope.$on(CHAT_EVENTS.CONVERSATIONS.NEW, function(event, data) {
      addConversation(data);
    });

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
