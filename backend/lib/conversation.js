'use strict';

var CONSTANTS = require('../lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var async = require('async');
var _ = require('lodash');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Types.ObjectId;
  var Conversation = mongoose.model('ChatConversation');
  var ChatMessage = mongoose.model('ChatMessage');

  var pubsubGlobal = dependencies('pubsub').global;
  var channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);
  var updateChannelTopic = pubsubGlobal.topic(TOPIC_UPDATED);
  var logger = dependencies('logger');

  function getChannels(options, callback) {
    Conversation.find({type: CONVERSATION_TYPE.CHANNEL}).populate('members').exec(function(err, channels) {
      channels = channels || [];
      if (channels.length === 0) {
        return createConversation(CONSTANTS.DEFAULT_CHANNEL, function(err, channel) {
          if (err) {
            return callback(new Error('Can not create the default channel'));
          }
          callback(null, [channel]);
        });
      }
      callback(err, channels);
    });
  }

  function getConversation(channel, callback) {
    Conversation.findById(channel).populate('members').exec(callback);
  }

  function getCommunityConversationByCommunityId(communityId, callback) {
    Conversation.findOne({type: CONVERSATION_TYPE.COMMUNITY, community: communityId}).populate('members').exec(callback);
  }

  function deleteConversation(channel, callback) {
    Conversation.findByIdAndRemove(channel, callback);
  }

  function findConversationByTypeAndByMembers(type, exactMatch, members, callback) {
    var request = {
      type:  type,
      members: {
        $all: members.map(function(participant) {
          return new ObjectId(participant);
        })
      }
    };

    if (exactMatch) {
      request.members.$size = members.length;
    }

    Conversation.find(request).populate('members').exec(callback);
  }

  function createConversation(options, callback) {
    async.waterfall([
        function(callback) {
          var channel = new Conversation(options);
          channel.save(callback);
        },
        function(channel, _num, callback) {
          Conversation.populate(channel, 'members', callback);
        },
        function(channel, callback) {
          channelCreationTopic.publish(JSON.parse(JSON.stringify(channel)));
          callback(null, channel);
        }
    ], callback);
  }

  function parseMention(message) {
    message.user_mentions = _.uniq(message.text.match(/@[a-fA-F0-9]{24}/g)).map(function(mention) {
      return new ObjectId(mention.replace(/^@/, ''));
    });
  }

  function createMessage(message, callback) {
    parseMention(message);
    var chatMessage = new ChatMessage(message);
    async.waterfall([
        function(callback) {
          chatMessage.save(callback);
        },
        function(message, _num, callback) {
          Conversation.update({_id: message.channel}, {$set: {last_message: {
            text: message.text,
            date: message.timestamps.creation
          }}}, function(err) {
            if (err) {
              logger.error('Can not update channel with last_update', err);
            }
            callback(null, message);
          });
        },
        function(message, callback) {
          ChatMessage.populate(message, [{path: 'user_mentions'}, {path: 'creator'}], callback);
        },
        function(message, callback) {
          callback(null, message.toJSON());
        }
    ], callback);
  }

  function addMemberToConversation(channelId, userId, callback) {
    Conversation.update({_id: channelId}, {
      $addToSet: {members: userId.constructor === ObjectId ? userId : new ObjectId(userId)}
    }, callback);
  }

  function removeMemberFromConversation(channelId, userId, callback) {
    Conversation.update({_id: channelId}, {
      $pull: {members: new ObjectId(userId)}
    }, callback);
  }

  function getMessage(messageId, callback) {
    ChatMessage.findById(messageId).populate('creator user_mentions').exec(callback);
  }

  function getMessages(channel, query, callback) {
    query = query || {};
    var channelId = channel._id || channel;
    var q = {channel: channelId};
    var mq = ChatMessage.find(q);
    mq.populate('creator');
    mq.populate('user_mentions');
    mq.limit(query.limit || 20);
    mq.skip(query.offset || 0);
    mq.sort('-timestamps.creation');
    mq.exec(function(err, result) {
      if (!err) {
        result.reverse();
      }

      callback(err, result);
    });
  }

  function updateTopic(channelId, topic, callback) {
    Conversation.findByIdAndUpdate({_id: channelId}, {
      $set: {
        topic: {
          value: topic.value,
          creator: topic.creator,
          last_set: topic.last_set
        }
      }
    }, function(err, channel) {
      var message = {
        type: 'text',
        subtype: 'channel:topic',
        date: Date.now(),
        channel: String(channel._id),
        user: String(topic.creator),
        topic: {
          value: channel.topic.value,
          creator: String(channel.topic.creator),
          last_set: channel.topic.last_set
        },
        text: 'set the channel topic: ' + topic.value
      };
      updateChannelTopic.publish(message);
      callback(err, channel);
    });
  }

  function countMessages(channel, callback) {
    ChatMessage.count({channel: channel}, callback);
  }

  return {
    getMessage: getMessage,
    getMessages: getMessages,
    getCommunityConversationByCommunityId: getCommunityConversationByCommunityId,
    addMemberToConversation: addMemberToConversation,
    removeMemberFromConversation: removeMemberFromConversation,
    findConversationByTypeAndByMembers: findConversationByTypeAndByMembers,
    createMessage: createMessage,
    createConversation: createConversation,
    getConversation: getConversation,
    getChannels: getChannels,
    deleteConversation: deleteConversation,
    updateTopic: updateTopic,
    countMessages: countMessages
  };
};
