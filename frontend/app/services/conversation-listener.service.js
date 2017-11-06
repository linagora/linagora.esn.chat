(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationListenerService', chatConversationListenerService);

  function chatConversationListenerService($rootScope, session, chatConversationService, chatConversationActionsService, chatConversationsStoreService, chatMessengerService, chatParseMention, CHAT_NAMESPACE, CHAT_EVENTS, CHAT_CONVERSATION_TYPE) {
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
      $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        onMessage(message);
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
