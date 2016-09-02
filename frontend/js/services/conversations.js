'use strict';

angular.module('linagora.esn.chat')
  .factory('conversationsService', function($rootScope, $q, $log, CHAT_CONVERSATION_TYPE, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, ChatRestangular, _) {

    var defer = $q.defer();
    var conversationsPromise = defer.promise;
    session.ready.then(function() {
      fetchAllConversation();
    });

    var sio = livenotification(CHAT_NAMESPACE);
    sio.on(CHAT_EVENTS.CONVERSATION_DELETION, deleteConversationInCache);

    function fetchAllConversation() {
      return $q.all({
        conversations: ChatRestangular.one('me').all('conversation').getList(),
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

    var getConversationNamePromise = session.ready.then(function(session) {
      var myId = session.user._id;
      return function(group) {
        return group.name || _.chain(group.members)
          .reject({_id: myId})
          .map(function(u) {
            return u.firstname + ' ' + u.lastname;
          })
        .value()
          .join(', ');
      };
    });

    function getConversationByType(type) {
      return conversationsPromise.then(_.partialRight(_.filter, {type: type}));
    }

    function getPrivateConversations(options) {
      return getConversationByType(CHAT_CONVERSATION_TYPE.PRIVATE);
    }

    function getChannels(options) {
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

    return {
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
  });
