'use strict';

angular.module('linagora.esn.chat')
  .factory('conversationsService', function($rootScope, $q, $log, CHAT_CONVERSATION_TYPE, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, ChatRestangular, _) {

    var defer = $q.defer();
    var conversationsPromise = defer.promise;
    session.ready.then(function() {
      fetchAllConversation();
    });

    function fetchAllConversation() {
      return $q.all({
        conversations: ChatRestangular.one('me').all('conversation').getList(),
        session: session.ready
      }).then(function(resolved) {
        var conversations = resolved.conversations.data;
        _.chain(conversations).filter({type: CHAT_CONVERSATION_TYPE.PRIVATE}).each(function(privateConversation) {
          privateConversation.name = computeGroupName(resolved.session.user._id, privateConversation);
        });

        defer.resolve(conversations);
      }, function(err) {
        $log.error('Can not fetch the user conversations', err);
        defer.reject(err);
      });
    }

    function computeGroupName(myId, group) {
      return _.chain(group.members)
        .reject({_id: myId})
        .map(function(u) {
          return u.firstname + ' ' + u.lastname;
        })
        .value()
        .join(', ');
    }

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

        return ChatRestangular.one('conversations', conversationId).get().then(function(response) {
          conversation =  response.data;

          if (!conversation || conversation.type !== CHAT_CONVERSATION_TYPE.PRIVATE) {
            return conversation;
          }

          return session.ready.then(function(session) {
            conversation.name = computeGroupName(session.user._id, conversation);
            return conversation;
          });
        });
      });
    }

    function postConversations(conversation) {
      return ChatRestangular.one('conversations').customPOST(conversation).then(function(c) {
        $rootScope.$broadcast(CHAT_EVENTS.CONVERSATIONS.NEW, c.data);
        return c;
      });
    }

    function addPrivateConversation(privateConversation) {
      privateConversation.type = CHAT_CONVERSATION_TYPE.PRIVATE;
      privateConversation.name = computeGroupName(session.user._id, privateConversation);
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

    return {
      computeGroupName: computeGroupName,
      getConversations: getConversations,
      getChannels: getChannels,
      getConversation: getConversation,
      getPrivateConversations: getPrivateConversations,
      addPrivateConversation: addPrivateConversation,
      addChannels: addChannels,
      updateConversationTopic: updateConversationTopic,
      setTopicChannel: setTopicChannel,
      getConversationByCommunityId: getConversationByCommunityId
    };
  });
