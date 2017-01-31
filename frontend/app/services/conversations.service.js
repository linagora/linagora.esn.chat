(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationsService', chatConversationsService);

    function chatConversationsService($rootScope, $q, $log, CHAT_CONVERSATION_TYPE, CHAT_CONVERSATION_MODE, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, chatConversationService, _) {
      var defer = $q.defer();
      var conversationsPromise = defer.promise;
      var sio = livenotification(CHAT_NAMESPACE);

      sio.on(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversationInCache);

      session.ready.then(function() {
        fetchAllConversations();
      });

      var service = {
        resetCache: resetCache,
        deleteConversation: deleteConversation,
        leaveConversation: leaveConversation,
        joinConversation: joinConversation,
        getConversations: getConversations,
        getChannels: getChannels,
        getConversation: getConversation,
        getPrivateConversations: getPrivateConversations,
        addPrivateConversation: addPrivateConversation,
        addChannels: addChannels,
        updateConversationTopic: updateConversationTopic,
        setTopicChannel: setTopicChannel,
        markAllMessageReaded: markAllMessageReaded,
        updateConversation: updateConversation
      };

      return service;

      ////////////

      function fetchAllConversations() {
        return $q.all({
          conversations: chatConversationService.listForCurrentUser(),
          session: session.ready
        }).then(function(resolved) {
          var conversations = resolved.conversations.data;

          defer.resolve(conversations);
        }, function(err) {
          $log.error('Can not fetch the user conversations', err);
          defer.reject(err);
        });
      }

      function resetCache() {
        defer = $q.defer();
        conversationsPromise = defer.promise;
        fetchAllConversations();
      }

      function getConversationByType(type) {
        return conversationsPromise.then(_.partialRight(_.filter, {type: type}));
      }

      function getPrivateConversations() {
        return getConversationByType(CHAT_CONVERSATION_TYPE.CONFIDENTIAL);
      }

      function getChannels() {
        return getConversationByType(CHAT_CONVERSATION_TYPE.OPEN);
      }

      function getConversation(conversationId) {
        return conversationsPromise.then(function(conversations) {
          var conversation = _.find(conversations, {_id: conversationId});

          if (conversation) {
            return conversation;
          }

          return chatConversationService.get(conversationId).then(_.property('data'));
        });
      }

      function postConversations(conversation) {
        return chatConversationService.create(conversation).then(function(result) {
          $rootScope.$broadcast(CHAT_EVENTS.CONVERSATIONS.NEW, result.data);

          return result;
        });
      }

      function joinConversation(conversationId) {
        return chatConversationService.join(conversationId, session.user._id);
      }

      function leaveConversation(conversationId) {
        return chatConversationService.leave(conversationId, session.user._id).then(function() {
          return deleteConversationInCache(conversationId);
        }, function(err) {
          $log.error('Could not leave conversation', err);
        });
      }

      function addPrivateConversation(privateConversation) {
        privateConversation.type = CHAT_CONVERSATION_TYPE.CONFIDENTIAL;
        privateConversation.mode = CHAT_CONVERSATION_MODE.CHANNEL;

        return postConversations(privateConversation);
      }

      function addChannels(channel) {
        channel.type = CHAT_CONVERSATION_TYPE.PUBLIC;
        channel.mode = CHAT_CONVERSATION_MODE.CHANNEL;

        return postConversations(channel);
      }

      function updateConversationTopic(topicValue, conversationId) {
        return chatConversationService.updateTopic(conversationId, topicValue);
      }

      function markAllMessageReaded(conversationId) {
        return chatConversationService.markAsRead(conversationId);
      }

      function setTopicChannel(topic) {
        return getConversation(topic.channel).then(function(channel) {
          channel.topic = topic.topic;

          return true;
        }, function() {
          return false;
        });
      }

      function getConversations() {
        return conversationsPromise;
      }

      function deleteConversationInCache(conversationId) {
        return conversationsPromise.then(function(conversations) {
          for (var i = 0, len = conversations.length; i < len; i++) {
            if (conversations[i]._id === conversationId) {
              conversations.splice(i, 1);

              return;
            }
          }
        });
      }

      function deleteConversation(conversationId) {
        return chatConversationService.remove(conversationId).then(function() {
          return deleteConversationInCache(conversationId);
        }, function(err) {
          $log.error('Could not delete conversation', err);
        });
      }

      function updateConversation(conversationId, modifications) {
        var body = {
          conversation: conversationId,
          modifications: modifications
        };

        chatConversationService.update(conversationId, body);

        return chatConversationService.update(conversationId, body);
      }
    }
})();
