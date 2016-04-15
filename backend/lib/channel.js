'use strict';

var CONSTANTS = require('../lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Types.ObjectId;
  var Channel = mongoose.model('ChatChannel');
  var ChatMessage = mongoose.model('ChatMessage');

  var pubsubGlobal = dependencies('pubsub').global;

  var channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);

  function getChannels(options, callback) {
    Channel.find(callback);
  }

  function getChannel(channel, callback) {
    Channel.findById(channel, callback);
  }

  function deleteChannel(channel, callback) {
    Channel.findByIdAndRemove(channel, callback);
  }

  function findGroupByMembers(exactMatch, members, callback) {
    var request = {
      type:  'group',
      members: {
        $all: members.map(function(participant) {
          return new ObjectId(participant);
        })
      }
    };

    if (exactMatch) {
      request.members.$size = members.length;
    }

    Channel.find(request, callback);
  }

  function createChannel(options, callback) {
    var channel = new Channel(options);
    channelCreationTopic.publish(JSON.parse(JSON.stringify(channel)));
    channel.save(callback);
  }

  function createMessage(message, callback) {
    var chatMessage = new ChatMessage(message);
    return chatMessage.save(callback);
  }

  function addMemberToChannel(channelId, userId, callback) {
    Channel.update({_id: channelId}, {
      $addToSet: {members: new ObjectId(userId)}
    }, callback);
  }

  function removeMemberFromChannel(channelId, userId, callback) {
    Channel.update({_id: channelId}, {
      $pull: {members: new ObjectId(userId)}
    }, callback);
  }

  function getMessages(channel, query, callback) {
    query = query || {};
    var channelId = channel._id || channel;
    var q = {channel: channelId};
    var mq = ChatMessage.find(q);
    mq.populate('creator');
    mq.limit(query.limit || 20);
    mq.skip(query.offset || 0);
    mq.sort('-timestamps.creation');
    mq.exec(callback);
  }

  return {
    getMessages: getMessages,
    addMemberToChannel: addMemberToChannel,
    removeMemberFromChannel: removeMemberFromChannel,
    findGroupByMembers: findGroupByMembers,
    createMessage: createMessage,
    createChannel: createChannel,
    getChannel: getChannel,
    getChannels: getChannels,
    deleteChannel: deleteChannel
  };
};
