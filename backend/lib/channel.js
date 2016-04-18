'use strict';

var CONSTANTS = require('../lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var async = require('async');

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Types.ObjectId;
  var Channel = mongoose.model('ChatChannel');
  var ChatMessage = mongoose.model('ChatMessage');

  var pubsubGlobal = dependencies('pubsub').global;

  var channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);

  function getChannels(options, callback) {
    var mq = Channel.find({type: 'channel'});
    mq.populate('members');
    mq.exec(callback);
  }

  function getChannel(channel, callback) {
    var mq = Channel.findById(channel);
    mq.populate('members');
    mq.exec(callback);
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

    var mq = Channel.find(request);
    mq.populate('members');
    mq.exec(callback);
  }

  function createChannel(options, callback) {
    async.waterfall([
        function(callback) {
          var channel = new Channel(options);
          channel.save(callback);
        },
        function(channel, _num, callback) {
          Channel.populate(channel, 'members', callback);
        },
        function(channel, callback) {
          channelCreationTopic.publish(JSON.parse(JSON.stringify(channel)));
          callback(null, channel);
        }
    ], callback);
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
