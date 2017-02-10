(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationListenerService', chatConversationListenerService);

  function chatConversationListenerService($rootScope, livenotification, chatConversationActionsService, chatConversationsStoreService, chatParseMention, CHAT_NAMESPACE, CHAT_EVENTS) {
    return {
      start: start
    };

    function addConversation(conversation) {
      chatConversationsStoreService.addConversation(conversation);
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

      conversation.last_message = {
        text: chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true}),
        date: message.timestamps.creation,
        creator: message.creator,
        user_mentions: message.user_mentions
      };
      conversation.canScrollDown = true;
    }

    function start() {
      var sio = livenotification(CHAT_NAMESPACE);

      sio.on(CHAT_EVENTS.NEW_CONVERSATION, addConversation);
      sio.on(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversation);
      sio.on(CHAT_EVENTS.CONVERSATIONS.ADD_NEW_MEMBERS, addNewMembers);
      sio.on(CHAT_EVENTS.CONVERSATIONS.UPDATE, updateConversation);
      sio.on(CHAT_EVENTS.CONVERSATION_TOPIC_UPDATED, topicUpdated);

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
