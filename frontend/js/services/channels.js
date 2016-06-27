'use strict';

angular.module('linagora.esn.chat')
  .factory('channelsService', function($rootScope, $q, CHAT_NAMESPACE, CHAT_EVENTS, livenotification, session, ChatRestangular, _) {
    var groups = [];
    var channels = [];

    session.ready.then(function(session) {
      var sio = livenotification(CHAT_NAMESPACE);
      sio.on(CHAT_EVENTS.NEW_CHANNEL, function(channel) {
        var room = _.find((channels || []).concat(groups || []), {_id: channel._id});
        if (!room) {
          if (channel.type === 'group') {
            channel.name = computeGroupName(session.user._id, channel);
            groups.push(channel);
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

    function getGroups(options) {
      if (groups.length) {
        return $q.when(groups);
      }

      return $q.all({
        session: session.ready,
        groups: ChatRestangular.one('me').all('groups').getList(options)
      }).then(function(resolved) {
        groups = resolved.groups.data.map(function(group) {
          group.name = computeGroupName(resolved.session.user._id, group);
          return group;
        });
        return groups;
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

    function getChannel(channelId) {
      var channel = _.find((channels || []).concat(groups || []), {_id: channelId});
      if (channel) {
        return $q.when(channel);
      }

      return ChatRestangular.one('channels', channelId).get().then(function(response) {
        var channel =  response.data;
        if (!channel || channel.type !== 'group') {
          return channel;
        }

        return session.ready.then(function(session) {
          channel.name = computeGroupName(session.user._id, channel);
          return channel;
        });
      });
    }

    function postChannels(channel) {
      return ChatRestangular.one('channels').customPOST(channel);
    }

    function addGroups(group) {
      group.type = 'group';
      return postChannels(group);
    }

    function addChannels(channel) {
      channel.type = 'channel';
      return postChannels(channel);
    }

    function updateChannelTopic(topicValue, channelId) {
      return ChatRestangular.one('channels', channelId).one('topic').customPUT({
        value: topicValue
      });
    }

    function setTopicChannel(topic) {
      return getChannel(topic.channel).then(function(channel) {
        channel.topic = topic.topic;
        return true;
      }, function() {
          return false;
        });
    }

    return {
      computeGroupName: computeGroupName,
      getChannels: getChannels,
      getChannel: getChannel,
      getGroups: getGroups,
      addGroups: addGroups,
      addChannels: addChannels,
      updateChannelTopic: updateChannelTopic,
      setTopicChannel: setTopicChannel
    };
  });
