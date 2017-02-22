(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationListenerService', chatConversationListenerService);

  function chatConversationListenerService($rootScope, session, chatConversationActionsService, chatConversationsStoreService, chatMessengerService, chatParseMention, CHAT_NAMESPACE, CHAT_EVENTS, CHAT_CONVERSATION_TYPE) {
    return {
      addEventListeners: addEventListeners,
      start: start
    };

    function addConversation(conversation) {
      if (conversation.type === CHAT_CONVERSATION_TYPE.CONFIDENTIAL || conversation.creator._id === session.user._id) {
        chatConversationsStoreService.addConversation(conversation);
      }
    }

    function addEventListeners() {
      chatMessengerService.addEventListener(CHAT_EVENTS.NEW_CONVERSATION, addConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATIONS.ADD_NEW_MEMBERS, addNewMembers);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATIONS.UPDATE, updateConversation);
      chatMessengerService.addEventListener(CHAT_EVENTS.CONVERSATION_TOPIC_UPDATED, topicUpdated);
    }

    function addNewMembers(conversation) {
      chatConversationsStoreService.addMembers(conversation, conversation.members);
    }

    function deleteConversation(conversation) {
      chatConversationsStoreService.deleteConversation(conversation);
    }

    function onMessage(message) {
      var conversation = chatConversationsStoreService.findConversation(message.channel);

      if (!conversation) {
        return;
      }

      chatConversationActionsService.increaseNumberOfUnreadMessages(conversation._id);
      chatConversationActionsService.updateUserMentionsCount(conversation._id, message.user_mentions);

      conversation.last_message = {
        text: chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true}),
        date: message.timestamps.creation,
        creator: message.creator,
        user_mentions: message.user_mentions
      };
      conversation.canScrollDown = true;
    }

    function start() {
      $rootScope.$on(CHAT_EVENTS.CONVERSATIONS.NEW, function(event, data) {
        addConversation(data);
      });

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
