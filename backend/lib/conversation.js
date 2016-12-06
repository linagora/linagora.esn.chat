'use strict';

const async = require('async');
const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('../lib/constants');

const CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
const CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
const CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const Conversation = mongoose.model('ChatConversation');
  const ChatMessage = mongoose.model('ChatMessage');
  const pubsubGlobal = dependencies('pubsub').global;
  const channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);
  const channelUpdateTopic = pubsubGlobal.topic(CONVERSATION_UPDATE);
  const channelDeletionTopic = pubsubGlobal.topic(CHANNEL_DELETION);
  const channelAddMember = pubsubGlobal.topic(MEMBER_ADDED_IN_CONVERSATION);
  const channelTopicUpdateTopic = pubsubGlobal.topic(TOPIC_UPDATED);
  const ensureObjectId = require('./utils')(dependencies).ensureObjectId;
  const messageLib = require('./message')(dependencies);
  const permission = require('./permission/conversation')(dependencies);
  const userConversationsFinders = [];

  return {
    addMember,
    create,
    find,
    getAllForUser,
    getById,
    getChannels,
    list,
    listForUser,
    moderate,
    permission,
    remove,
    removeMember,
    registerUserConversationFinder,
    update,
    updateTopic
  };

  function getChannels(options, callback) {
    Conversation.find({type: CONVERSATION_TYPE.CHANNEL, moderate: Boolean(options.moderate)}).populate('members', SKIP_FIELDS.USER).exec((err, channels) => {
      channels = channels || [];
      if (channels.length === 0) {
        return create(CONSTANTS.DEFAULT_CHANNEL, (err, channel) => {
          if (err) {
            return callback(new Error('Can not create the default channel'));
          }
          callback(null, [channel]);
        });
      }
      callback(err, channels);
    });
  }

  function getById(channelId, callback) {
    Conversation.findById(channelId).populate('members', SKIP_FIELDS.USER).exec(callback);
  }

  function remove(channelId, callback) {
    Conversation.findOneAndRemove({_id: channelId}, (err, result) => {
      if (err) {
        return callback(err);
      }

      channelDeletionTopic.publish(result);
      ChatMessage.remove({channel: channelId}, err => {
        callback(err, result);
      });
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
  function find(options, callback) {
    const type = options.type;
    const ignoreMemberFilterForChannel = options.ignoreMemberFilterForChannel;
    const exactMembersMatch = options.exactMembersMatch;
    const members = options.members;
    const name = options.name;
    const moderate = Boolean(options.moderate);

    if (exactMembersMatch && !members) {
      throw new Error('Could not set exactMembersMatch to true without providing members');
    }

    if (ignoreMemberFilterForChannel && !members) {
      throw new Error('Could not set ignoreMemberFilterForChannel to true without providing members');
    }

    let request = {moderate: moderate};

    if (members) {
      request.members = {
        $all: members.map(function(participant) {
          return new ObjectId(participant);
        })
      };
    }

    if (type) {
      request.type = {$in: _.isArray(type) ? type : [type]};
    }

    if (name) {
      request.name = name;
    }

    if (name === null) {
      request.$or = [{name: {$exists: false}}, {name: null}];
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

  function getAllForUser(user, options = {}) {
    function wrap(finder) {
      return finder(user, options).catch(err => {
        logger.warn('Failed to find conversations', err);

        return [];
      });
    }

    return Q.all(userConversationsFinders.map(finder => wrap(finder))).then(result => [].concat.apply([], result));
  }

  function listForUser(user, options, callback) {
    Conversation.find({type: {$in: [CONVERSATION_TYPE.CHANNEL, CONVERSATION_TYPE.PRIVATE]}, members: {$in: [user._id]}}).exec(callback);
  }

  function list(options, callback) {
    let query;
    const sort = 'timestamps.creation';

    options = options || {};
    options.limit = +(options.limit || CONSTANTS.DEFAULT_LIMIT);
    options.offset = +(options.offset || CONSTANTS.DEFAULT_OFFSET);

    if (options.creator) {
      query = query || {};
      query.creator = options.creator;
    }

    let conversationQuery = query ? Conversation.find(query) : Conversation.find();

    Conversation.find(conversationQuery).count().exec((err, count) => {
      if (err) {
        return callback(err);
      }

      conversationQuery = conversationQuery.skip(options.offset);

      if (options.limit > 0) {
        conversationQuery = conversationQuery.limit(options.limit);
      }

      conversationQuery.sort(sort).populate('creator members last_message.creator', CONSTANTS.SKIP_FIELDS.USER).exec((err, conversations) => {
        if (err) {
          return callback(err);
        }
        callback(null, {
          total_count: count,
          list: conversations || []
        });
      });
    });
  }

  function create(options, callback) {
    async.waterfall([
        function(callback) {
          const conversation = new Conversation(options);

          conversation.last_message = {
            date: conversation.timestamps && conversation.timestamps.creation || new Date(),
            user_mentions: []
          };
          conversation.numOfMessage = conversation.numOfMessage || 0;
          conversation.numOfReadedMessage = conversation.numOfReadedMessage || {};
          conversation.save(callback);
        },
        /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
        function(conversation, _num, callback) {
          Conversation.populate(conversation, 'members', callback);
        },
        function(conversation, callback) {
          channelCreationTopic.publish(JSON.parse(JSON.stringify(conversation)));
          callback(null, conversation);
        }
    ], callback);
  }

  function addMember(conversationId, userId, callback) {
    const userObjectId = ensureObjectId(userId);

    Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: {members: userObjectId}
    }, function(err, conversation) {
      if (err) {
        return callback(err);
      }

      messageLib.markAllAsRead(userId, conversation, callback);
      channelAddMember.publish(conversation);
    });
  }

  function update(conversationId, modifications, callback) {

    const mongoModifications = {};
    let nextMongoModification = null;

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

      Conversation.populate(conversation.toObject(), 'members', (err, conversation) => {
        if (err) {
          return callback(err);
        }

        channelUpdateTopic.publish({
          conversation: conversation,
          deleteMembers: modifications.deleteMembers
        });

        if (modifications.newMembers && modifications.newMembers.length) {
          messageLib.markAllAsRead((nextMongoModification || mongoModifications).$addToSet.$each, conversation, callback);
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

    Conversation.findOneAndUpdate({_id: conversationId}, mongoModifications, (err, conversation) => {
      if (nextMongoModification) {
        Conversation.findOneAndUpdate({_id: conversationId}, nextMongoModification, done.bind(null, callback));
      } else {
        done(callback, err, conversation);
      }
    });
  }

  function moderate(conversationId, moderate, callback) {
    Conversation.findByIdAndUpdate(conversationId, {
      $set: {moderate: moderate}
    }, {
      new: true
    }, callback);
  }

  function registerUserConversationFinder(finder) {
    finder && userConversationsFinders.push(finder);
  }

  function removeMember(conversationId, userId, callback) {
    const unsetOperation = {};

    unsetOperation['numOfReadedMessage.' + userId] = '';
    Conversation.findByIdAndUpdate(conversationId, {
      $pull: {members: new ObjectId(userId)},
      $unset: unsetOperation
    }, (err, conversation) => {
      if (!err) {
        channelUpdateTopic.publish({
          conversation: conversation,
          deleteMembers: [{_id: userId}]
        });
      }
      callback(err, conversation);
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
      const message = {
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
};
