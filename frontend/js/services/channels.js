'use strict';

angular.module('linagora.esn.chat')
  .factory('conversationsService', function($rootScope, $q, CHAT_CONVERSATION_TYPE, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, ChatRestangular, _) {
    var privates = [];
    var channels = [];

    session.ready.then(function(session) {
      var sio = livenotification(CHAT_NAMESPACE);
      sio.on(CHAT_EVENTS.NEW_CHANNEL, function(channel) {
        var room = _.find((channels || []).concat(privates || []), {_id: channel._id});
        if (!room) {
          if (channel.type === CHAT_CONVERSATION_TYPE.PRIVATE) {
            channel.name = computeGroupName(session.user._id, channel);
            privates.push(channel);
          } else {
            channels.push(channel);
          }
        }
      });

      $rootScope.$on(CHAT_EVENTS.TOPIC_UPDATED, function(event, data) {
        setTopicChannel(data);
      });
    });

    function computeGroupName(myId, group) {
      return _.chain(group.members)
        .reject({_id: myId})
        .map(function(u) {
          return u.firstname + ' ' + u.lastname;
        })
        .value()
        .join(', ');
    }

    function getPrivateConversations(options) {
      if (privates.length) {
        return $q.when(privates);
      }

      return $q.all({
        session: session.ready,
        privates: ChatRestangular.one('me').all('private').getList(options)
      }).then(function(resolved) {
        privates = resolved.privates.data.map(function(privateConversation) {
          privateConversation.name = computeGroupName(resolved.session.user._id, privateConversation);
          return privateConversation;
        });
        return privates;
      });
    }

    function getChannels(options) {
      if (channels.length) {
        return $q.when(channels);
      }
      return ChatRestangular.all('channels').getList(options).then(function(response) {
        channels = response.data;
        return channels;
      });
    }

    function getConversation(channelId) {
      var channel = _.find((channels || []).concat(privates || []), {_id: channelId});
      if (channel) {
        return $q.when(channel);
      }

      return ChatRestangular.one('conversations', channelId).get().then(function(response) {
        var channel =  response.data;
        if (!channel || channel.type !== CHAT_CONVERSATION_TYPE.PRIVATE) {
          return channel;
        }

        return session.ready.then(function(session) {
          channel.name = computeGroupName(session.user._id, channel);
          return channel;
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

    function updateConversationTopic(topicValue, channelId) {
      return ChatRestangular.one('conversations', channelId).one('topic').customPUT({
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

    return {
      computeGroupName: computeGroupName,
      getChannels: getChannels,
      getConversation: getConversation,
      getPrivateConversations: getPrivateConversations,
      addPrivateConversation: addPrivateConversation,
      addChannels: addChannels,
      updateConversationTopic: updateConversationTopic,
      setTopicChannel: setTopicChannel
    };
  });
