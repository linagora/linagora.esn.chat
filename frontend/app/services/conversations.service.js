(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationsService', chatConversationsService);

    chatConversationsService.$inject = ['$rootScope', '$q', '$log', 'CHAT_CONVERSATION_TYPE', 'CHAT_NAMESPACE', 'CHAT_EVENTS', 'livenotification', 'session', 'ChatRestangular', '_'];

    function chatConversationsService($rootScope, $q, $log, CHAT_CONVERSATION_TYPE, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, ChatRestangular, _) {
      var defer = $q.defer();
      var conversationsPromise = defer.promise;
      var sio = livenotification(CHAT_NAMESPACE);

      session.ready.then(function() {
        fetchAllConversation();
      });

      sio.on(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversationInCache);
      var getConversationNamePromise = session.ready.then(function(session) {
        var myId = session.user._id;

        return function(group, onlyFirstName) {
          function userToString(u) {
            return onlyFirstName ? u.firstname : (u.firstname + ' ' + u.lastname);
          }

          if (!group || (!group.name && !group.members)) {
            return;
          } else if (group.name) {
            return group.name;
          } else if (group.members.length === 1) {
            return userToString(group.members[0]);
          } else {
            return _.chain(group.members)
              .reject({_id: myId})
              .map(userToString)
              .value()
              .join(', ');
          }
        };
      });

      var service = {
        getConversationNamePromise: getConversationNamePromise,
        resetCache: resetCache,
        deleteConversation: deleteConversation,
        leaveConversation: leaveConversation,
        getConversations: getConversations,
        getChannels: getChannels,
        getConversation: getConversation,
        getPrivateConversations: getPrivateConversations,
        addPrivateConversation: addPrivateConversation,
        addChannels: addChannels,
        updateConversationTopic: updateConversationTopic,
        setTopicChannel: setTopicChannel,
        markAllMessageReaded: markAllMessageReaded,
        getConversationByCommunityId: getConversationByCommunityId,
        updateConversation: updateConversation
      };

      return service;

      ////////////

      function fetchAllConversation() {
        return $q.all({
          conversations: ChatRestangular.one('user').all('conversations').getList(),
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
        fetchAllConversation();
      }

      function getConversationByType(type) {
        return conversationsPromise.then(_.partialRight(_.filter, {type: type}));
      }

      function getPrivateConversations() {
        return getConversationByType(CHAT_CONVERSATION_TYPE.PRIVATE);
      }

      function getChannels() {
        return getConversationByType(CHAT_CONVERSATION_TYPE.CHANNEL);
      }

      function getConversation(conversationId) {
        return conversationsPromise.then(function(conversations) {
          var conversation = _.find(conversations, {_id: conversationId});

          if (conversation) {
            return conversation;
          }

          return ChatRestangular.one('conversations', conversationId).get().then(_.property('data'));
        });
      }

      function postConversations(conversation) {
        return ChatRestangular.one('conversations').customPOST(conversation).then(function(c) {
          $rootScope.$broadcast(CHAT_EVENTS.CONVERSATIONS.NEW, c.data);

          return c;
        });
      }

      function leaveConversation(conversationId) {
        return ChatRestangular.one('conversations', conversationId).one('members').doDELETE().then(function() {
          return deleteConversationInCache(conversationId);
        }, function(err) {
          $log.error('Could not leave conversation', err);
        });
      }

      function addPrivateConversation(privateConversation) {
        privateConversation.type = CHAT_CONVERSATION_TYPE.PRIVATE;

        return postConversations(privateConversation);
      }

      function addChannels(channel) {
        channel.type = CHAT_CONVERSATION_TYPE.CHANNEL;

        return postConversations(channel);
      }

      function updateConversationTopic(topicValue, conversationId) {
        return ChatRestangular.one('conversations', conversationId).one('topic').customPUT({
          value: topicValue
        });
      }

      function markAllMessageReaded(conversationId) {
        return ChatRestangular.one('conversations', conversationId).one('readed').doPOST();
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

      function getConversationByCommunityId(communityId) {
        return ChatRestangular.one('community').get({id: communityId});
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
        return ChatRestangular.one('conversations', conversationId).doDELETE().then(function() {
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

        return ChatRestangular.one('conversations', conversationId).customPUT(body);
      }
    }
})();
