'use strict';

var CONSTANTS = require('../lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
var CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
var MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var async = require('async');
var _ = require('lodash');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
var SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Types.ObjectId;
  var Conversation = mongoose.model('ChatConversation');
  var ChatMessage = mongoose.model('ChatMessage');

  var pubsubGlobal = dependencies('pubsub').global;
  var channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);
  var channelUpdateTopic = pubsubGlobal.topic(CONVERSATION_UPDATE);
  var channelDeletionTopic = pubsubGlobal.topic(CHANNEL_DELETION);
  var channelAddMember = pubsubGlobal.topic(MEMBER_ADDED_IN_CONVERSATION);
  var channelTopicUpdateTopic = pubsubGlobal.topic(TOPIC_UPDATED);
  var logger = dependencies('logger');

  function getChannels(options, callback) {
    Conversation.find({type: CONVERSATION_TYPE.CHANNEL, moderate: Boolean(options.moderate)}).populate('members', SKIP_FIELDS.USER).exec(function(err, channels) {
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
    Conversation.findById(channel).populate('members', SKIP_FIELDS.USER).exec(callback);
  }

  function getCommunityConversationByCommunityId(communityId, callback) {
    Conversation.findOne({type: CONVERSATION_TYPE.COMMUNITY, community: communityId}).populate('members', SKIP_FIELDS.USER).exec(callback);
  }

  function deleteConversation(userId, channel, callback) {
    Conversation.findOneAndRemove({_id: channel, members: userId}, function(err, deleteResult) {
      if (!err) {
        channelDeletionTopic.publish(deleteResult);
        ChatMessage.remove({channel: channel}, function(err, result) {
          callback(err, deleteResult);
        });
      } else {
        callback(err);
      }
    });
  }

  /**
   *
   * @param {string|[string]} options.type - allowed types if none provided all type are accepted
   * @param {boolean} options.ignoreMemberFilterForChannel - if true and if channel aren't excluded by the previous argument, all channel will be included even if they do not match the members filter.
   *    This makes sense because everybody can access channels even if there are not member of it.
   * @param {boolean} options.exactMembersMatch - if true only conversations that has exactly the same members will be filtered out otherwise only conversations that contains at least the provided members will be selected
   * @param {[string]} options.members of members' id
   * @param {string} options.name is undefined the conversation can have any name or no name. If null the conversation should have no name, if it's a string the conversation should have
   * @return {[Conversation]}
   */
  function findConversation(options, callback) {
    var type = options.type;
    var ignoreMemberFilterForChannel = options.ignoreMemberFilterForChannel;
    var exactMembersMatch = options.exactMembersMatch;
    var members = options.members;
    var name = options.name;
    var moderate = Boolean(options.moderate);

    if (exactMembersMatch && !members) {
      throw new Error('Could not set exactMembersMatch to true without providing members');
    }

    if (ignoreMemberFilterForChannel && !members) {
      throw new Error('Could not set ignoreMemberFilterForChannel to true without providing members');
    }

    var request = {moderate: moderate};

    if (members) {
      request.members = {
        $all: members.map(function(participant) {
          return new ObjectId(participant);
        })
      };
    }

    if (type) {
      request.type = {$in:  _.isArray(type) ? type : [type]};
    }

    if (name) {
      request.name = name;
    }

    if (name === null) {
      request.$or = [{name:  {$exists: false}}, {name: null}];
    }

    if (ignoreMemberFilterForChannel && (!type || type.indexOf(CONVERSATION_TYPE.CHANNEL) > -1)) {
      delete request.moderate;
      request = {
        $or: [request, {
          type: CONVERSATION_TYPE.CHANNEL
        }],
        moderate: moderate
      };
    }

    if (exactMembersMatch) {
      request.members.$size = members.length;
    }

    Conversation.find(request).populate('members', SKIP_FIELDS.USER).populate('last_message.creator', SKIP_FIELDS.USER).populate('last_message.user_mentions', SKIP_FIELDS.USER).sort('-last_message.date').exec(callback);
  }

  function listConversation(options, callback) {
    var query;
    options = options || {};
    options.limit = +(options.limit || CONSTANTS.DEFAULT_LIMIT);
    options.offset = +(options.offset || CONSTANTS.DEFAULT_OFFSET);
    var sort = 'timestamps.creation';

    if (options.creator) {
      query = query || {};
      query.creator = options.creator;
    }

    var conversationQuery = query ? Conversation.find(query) : Conversation.find();

    Conversation.find(conversationQuery).count().exec(function(err, count) {
      if (err) {
        return callback(err);
      }

      conversationQuery = conversationQuery.skip(options.offset);

      if (options.limit > 0) {
        conversationQuery = conversationQuery.limit(options.limit);
      }

      conversationQuery.sort(sort).populate('creator members last_message.creator', CONSTANTS.SKIP_FIELDS.USER).exec(function(err, causes) {
        if (err) {
          return callback(err);
        }
        callback(null, {
          total_count: count,
          list: causes || []
        });
      });
    });
  }

  function listMessage(options, callback) {
    var query;
    options = options || {};
    options.limit = +(options.limit || CONSTANTS.DEFAULT_LIMIT);
    options.offset = +(options.offset || CONSTANTS.DEFAULT_OFFSET);
    var sort = 'timestamps.creation';

    if (options.creator) {
      query = query || {};
      query.creator = options.creator;
    }

    var messageQuery = query ? ChatMessage.find(query) : ChatMessage.find();
    ChatMessage.find(messageQuery).count().exec(function(err, count) {
      if (err) {
        return callback(err);
      }

      var messageQuery = query ? ChatMessage.find(query) : ChatMessage.find();
      messageQuery = messageQuery.skip(options.offset);

      if (options.limit > 0) {
        messageQuery = messageQuery.limit(options.limit);
      }

      messageQuery.sort(sort).populate('creator', CONSTANTS.SKIP_FIELDS.USER).exec(function(err, causes) {
        if (err) {
          return callback(err);
        }
        callback(null, {
          total_count: count,
          list: causes || []
        });
      });
    });
  }

  function createConversation(options, callback) {
    async.waterfall([
        function(callback) {
          var conversation = new Conversation(options);
          conversation.last_message = {
            date: conversation.timestamps && conversation.timestamps.creation || new Date(),
            user_mentions: []
          };
          conversation.numOfMessage = conversation.numOfMessage || 0;
          conversation.numOfReadedMessage = conversation.numOfReadedMessage || {};
          conversation.save(callback);
        },
        function(conversation, _num, callback) {
          Conversation.populate(conversation, 'members', callback);
        },
        function(conversation, callback) {
          channelCreationTopic.publish(JSON.parse(JSON.stringify(conversation)));
          callback(null, conversation);
        }
    ], callback);
  }

  function parseMention(message) {
    message.user_mentions = _.uniq(message.text.match(/@[a-fA-F0-9]{24}/g)).map(function(mention) {
      return new ObjectId(mention.replace(/^@/, ''));
    });
  }

  function makeAllMessageReadedForAnUserHelper(userIds, conversation, callback) {
    userIds = _.isArray(userIds) ? userIds : [userIds];
    var updateMaxOperation = {};
    userIds.forEach(function(userId) {
      updateMaxOperation['numOfReadedMessage.' + String(userId)] = conversation.numOfMessage;
    });

    Conversation.findByIdAndUpdate(conversation._id, {
      $max: updateMaxOperation
    }, callback);
  }

  function makeAllMessageReadedForAnUser(userId, conversationId, callback) {
    Conversation.findOne({_id: conversationId}, function(err, conversation) {
      if (err) {
        return callback(err);
      }

      makeAllMessageReadedForAnUserHelper(userId, conversation, callback);
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
          Conversation.findByIdAndUpdate(message.channel, {
            $set: {
              last_message: {
                text: message.text,
                date: message.timestamps.creation,
                creator: message.creator,
                user_mentions: message.user_mentions
              }
            },
            $inc: {
              numOfMessage: 1
            }
          }, function(err, conversation) {
            if (err) {
              logger.error('Can not update channel with last_update', err);
            }
            callback(null, message, conversation);
          });
        },
        function(message, conversation, callback) {
          makeAllMessageReadedForAnUserHelper(message.creator, conversation, function(err) {
            callback(err, message);
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

  function ensureObjectId(id) {
    return id.constructor === ObjectId ? id : new ObjectId(id);
  }

  function addMemberToConversation(conversationId, userId, callback) {
    var userObjectId = ensureObjectId(userId);
    Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: {members: userObjectId}
    }, function(err, conversation) {
      if (err) {
        return callback(err);
      }

      makeAllMessageReadedForAnUserHelper(userId, conversation, callback);
      channelAddMember.publish(conversation);
    });
  }

  function updateCommunityConversation(communityId, modifications, callback) {

    var mongoModifications = {};

    if (modifications.newMembers) {
      mongoModifications.$addToSet = {
        members: {
          $each: modifications.newMembers.map(ensureObjectId)
        }
      };
    }

    if (modifications.deleteMembers) {
      mongoModifications.$pullAll = {
        members: modifications.deleteMembers.map(ensureObjectId)
      };
    }

    if (modifications.title) {
      mongoModifications.$set = {name: modifications.title};
    }

    Conversation.findOneAndUpdate({type: CONVERSATION_TYPE.COMMUNITY, community: communityId}, mongoModifications, function(err, conversation) {
      if (err) {
        return callback(err);
      }

      if (mongoModifications.$addToSet) {
        makeAllMessageReadedForAnUserHelper(mongoModifications.$addToSet.$each, conversation, callback);
      } else {
        callback(err, conversation);
      }
    });
  }

  function updateConversation(communityId, modifications, callback) {

    var mongoModifications = {};
    var nextMongoModification = null;

    if (modifications.newMembers && modifications.newMembers.length) {
      mongoModifications.$addToSet = {
        members: {
          $each: modifications.newMembers.map(ensureObjectId)
        }
      };
    }

    if (modifications.deleteMembers && modifications.deleteMembers.length) {
      mongoModifications.$pullAll = {
        members: modifications.deleteMembers.map(ensureObjectId)
      };
    }

    mongoModifications.$set = {};
    if (modifications.name) {
      mongoModifications.$set.name = modifications.name;
    }

    if (modifications.avatar) {
      mongoModifications.$set.avatar = new ObjectId(modifications.avatar);
    }

    function done(callback, err, conversation) {
      if (err) {
        return callback(err);
      }

      Conversation.populate(conversation.toObject(), 'members', function(err, conversation) {
        if (err) {
          return callback(err);
        }

        channelUpdateTopic.publish({
          conversation: conversation,
          deleteMembers: modifications.deleteMembers
        });

        if (modifications.newMembers && modifications.newMembers.length) {
          makeAllMessageReadedForAnUserHelper((nextMongoModification || mongoModifications).$addToSet.$each, conversation, callback);
        } else {
          callback(err, conversation);
        }
      });
    }

    if (mongoModifications.$addToSet && mongoModifications.$pullAll) {
      //mongo does not allow to do those modification in one request
      nextMongoModification = {$addToSet: mongoModifications.$addToSet};
      delete mongoModifications.$addToSet;
    }

    if (_.isEmpty(mongoModifications.$set)) {
      delete mongoModifications.$set;
    }

    Conversation.findOneAndUpdate({_id: communityId}, mongoModifications, function(err, conversation) {
      if (nextMongoModification) {
        Conversation.findOneAndUpdate({_id: communityId}, nextMongoModification, done.bind(null, callback));
      } else {
        done(callback, err, conversation);
      }
    });
  }

  function moderateConversation(conversationId, moderate, callback) {
    Conversation.findByIdAndUpdate(conversationId, {
      $set: {moderate: moderate}
    }, callback);
  }

  function moderateMessage(messageId, moderate, callback) {
    ChatMessage.findByIdAndUpdate(messageId, {
      $set: {moderate: moderate}
    }, callback);
  }

  function removeMemberFromConversation(conversationId, userId, callback) {
    var unsetOperation = {};
    unsetOperation['numOfReadedMessage.' + userId] = '';
    Conversation.findByIdAndUpdate(conversationId, {
      $pull: {members: new ObjectId(userId)},
      $unset: unsetOperation
    }, function(err, conversation) {
      if (!err) {
        channelUpdateTopic.publish({
          conversation: conversation,
          deleteMembers: [{_id: userId}]
        });
      }
      callback(err, conversation);
    });
  }

  function getMessage(messageId, callback) {
    ChatMessage.findById(messageId).populate('creator user_mentions', SKIP_FIELDS.USER).exec(callback);
  }

  function getMessages(conversation, query, callback) {
    query = query || {};

    if (!query.moderate) {
      query.moderate = false;
    }

    var conversationId = conversation._id || conversation;
    var q = {channel: conversationId, moderate: false};
    var mq = ChatMessage.find(q);
    mq.populate('creator', SKIP_FIELDS.USER);
    mq.populate('user_mentions', SKIP_FIELDS.USER);
    mq.limit(+query.limit || 20);
    mq.skip(+query.offset || 0);
    mq.sort('-timestamps.creation');
    mq.exec(function(err, result) {
      if (!err) {
        result.reverse();
      }

      callback(err, result);
    });
  }

  function updateTopic(conversationId, topic, callback) {
    Conversation.findByIdAndUpdate({_id: conversationId}, {
      $set: {
        topic: {
          value: topic.value,
          creator: topic.creator,
          last_set: topic.last_set
        }
      }
    }, function(err, conversation) {
      var message = {
        type: 'text',
        subtype: 'channel:topic',
        date: Date.now(),
        channel: String(conversation._id),
        user: String(topic.creator),
        topic: {
          value: conversation.topic.value,
          creator: String(conversation.topic.creator),
          last_set: conversation.topic.last_set
        },
        text: 'set the channel topic: ' + topic.value
      };
      channelTopicUpdateTopic.publish(message);
      callback(err, conversation);
    });
  }

  function countMessages(conversation, callback) {
    ChatMessage.count({channel: conversation}, callback);
  }

  return {
    getMessage: getMessage,
    getMessages: getMessages,
    getCommunityConversationByCommunityId: getCommunityConversationByCommunityId,
    addMemberToConversation: addMemberToConversation,
    updateCommunityConversation: updateCommunityConversation,
    updateConversation: updateConversation,
    moderateConversation: moderateConversation,
    moderateMessage: moderateMessage,
    removeMemberFromConversation: removeMemberFromConversation,
    findConversation: findConversation,
    createMessage: createMessage,
    createConversation: createConversation,
    getConversation: getConversation,
    getChannels: getChannels,
    deleteConversation: deleteConversation,
    updateTopic: updateTopic,
    makeAllMessageReadedForAnUser: makeAllMessageReadedForAnUser,
    countMessages: countMessages,
    listConversation: listConversation,
    listMessage: listMessage
  };
};
