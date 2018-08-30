(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationListenerService', chatConversationListenerService);

  function chatConversationListenerService(
    _,
    $rootScope,
    $state,
    chatConversationService,
    chatConversationActionsService,
    chatConversationsStoreService,
    chatMessengerService,
    chatParseMention,
    esnAppStateService,
    CHAT_WEBSOCKET_EVENTS,
    CHAT_EVENTS,
    CHAT_CONVERSATION_TYPE,
    CHAT_MARK_AS_READ_THROTTLE_TIMER
  ) {
    var markAllMessagesAsReadThrottled = _.throttle(chatConversationActionsService.markAllMessagesAsRead, CHAT_MARK_AS_READ_THROTTLE_TIMER, {
      leading: false,
      trailing: true
    });

    return {
      addEventListeners: addEventListeners,
      start: start
    };

    function addConversation(conversation) {
      // Will be fixed in CHAT-307: denormalize conversation in websocket
      return chatConversationService.get(conversation._id)
        .then(chatConversationActionsService.addConversationWhenCreatorOrConfidential);
    }

    function addEventListeners() {
      chatMessengerService.addEventListener(CHAT_EVENTS.NEW_CONVERSATION, addConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.MEMBER_ADDED_TO_CONVERSATION, memberHasBeenAdded);
      chatMessengerService.addEventListener(CHAT_EVENTS.MEMBER_JOINED_CONVERSATION, memberHasJoined);
      chatMessengerService.addEventListener(CHAT_EVENTS.MEMBER_LEFT_CONVERSATION, memberHasLeft);
      chatMessengerService.addEventListener(CHAT_WEBSOCKET_EVENTS.CONVERSATION.MEMBER_READ, memberHasRead);
      chatMessengerService.addEventListener(CHAT_WEBSOCKET_EVENTS.CONVERSATION.MEMBER_UNSUBSCRIBED, memberHasUnsubscribed);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATIONS.UPDATE, updateConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATION_TOPIC_UPDATED, topicUpdated);
    }

    function deleteConversation(conversation) {
      chatConversationsStoreService.deleteConversation(conversation);
    }

    function memberHasBeenAdded(event) {
      chatConversationActionsService.memberHasBeenAdded(event.conversation, event.member, event.by_member);
    }

    function memberHasJoined(event) {
      chatConversationActionsService.updateMembers(event.conversation, event.members_count);
    }

    function memberHasLeft(event) {
      chatConversationActionsService.updateMembers(event.conversation, event.members_count);
    }

    function memberHasRead(event) {
      chatConversationsStoreService.resetNumberOfUnreadMessages(event.conversationId);
      chatConversationsStoreService.resetNumberOfUnseenMentions(event.conversationId);
      $rootScope.$broadcast(CHAT_EVENTS.MEMBER_READ_CONVERSATION, event);
    }

    function memberHasUnsubscribed(event) {
      chatConversationsStoreService.deleteConversations(event.conversationIds);

      event.conversationIds.some(function(conversationId) {
        if (chatConversationsStoreService.isActiveRoom(conversationId)) {
          $state.go('chat.channels-views', { id: chatConversationsStoreService.channels[0]._id });

          return true;
        }
      });
    }

    function updateConversationOnMessage(message, conversation) {
      chatConversationActionsService.increaseNumberOfUnreadMessages(conversation._id);
      chatConversationActionsService.updateUserMentionsCount(conversation._id, message.user_mentions);
      chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true}).then(function(text) {
        conversation.last_message = {
          text: text,
          date: message.timestamps.creation,
          creator: message.creator,
          user_mentions: message.user_mentions
        };
      });
      conversation.canScrollDown = true;
      if (esnAppStateService.isForeground() && chatConversationsStoreService.isActiveRoom(conversation._id)) {
        markAllMessagesAsReadThrottled(conversation);
      }
    }

    function onMessage(message) {
      var conversation = chatConversationsStoreService.findConversation(message.channel);

      if (!conversation) {
        chatConversationActionsService.getConversation(message.channel).then(function(conversation) {

          if (conversation && conversation.type === CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE) {
            chatConversationActionsService.addConversation(conversation).then(function(conversation) {
              updateConversationOnMessage(message, conversation);
            });
          }
        });

      } else {
        updateConversationOnMessage(message, conversation);
      }
    }

    function start() {
      [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(event) {
        $rootScope.$on(event, function(evt, message) {
          onMessage(message);
        });
      });
    }

    function updateConversation(conversation) {
      return chatConversationsStoreService.updateConversation(conversation);
    }

    function topicUpdated(conversation) {
      return chatConversationsStoreService.updateTopic(conversation, conversation.topic);
    }
  }
})();
