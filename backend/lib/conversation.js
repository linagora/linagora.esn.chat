'use strict';

const Q = require('q');
const CONSTANTS = require('../lib/constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
const CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
const CHANNEL_SAVED = CONSTANTS.NOTIFICATIONS.CHANNEL_SAVED;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const Conversation = mongoose.model('ChatConversation');
  const pubsubGlobal = dependencies('pubsub').global;
  const pubsubLocal = dependencies('pubsub').local;
  const channelCreationTopic = pubsubGlobal.topic(CHANNEL_CREATION);
  const channelTopicUpdateTopic = pubsubGlobal.topic(TOPIC_UPDATED);
  const topicUpdateTopic = pubsubLocal.topic(TOPIC_UPDATED);
  const channelSavedTopic = pubsubLocal.topic(CHANNEL_SAVED);
  const permission = require('./permission/conversation')(dependencies);
  const userConversationsFinders = [];

  return {
    create,
    find,
    getAllForUser,
    getById,
    getChannels,
    init,
    list,
    listForUser,
    moderate,
    permission,
    registerUserConversationFinder,
    update,
    updateTopic
  };

  function create(options, callback) {
    const conversation = new Conversation(options);

    conversation.save((err, saved) => {
      if (!err) {
        channelCreationTopic.publish(JSON.parse(JSON.stringify(saved)));
        channelSavedTopic.publish(saved);
      }
      callback(err, saved);
    });
  }

  function createDefaultChannel(callback) {
    Conversation.findOneAndUpdate(
      { name: CONSTANTS.DEFAULT_CHANNEL.name, type: CONSTANTS.DEFAULT_CHANNEL.type, mode: CONSTANTS.DEFAULT_CHANNEL.mode},
      { name: CONSTANTS.DEFAULT_CHANNEL.name, type: CONSTANTS.DEFAULT_CHANNEL.type, mode: CONSTANTS.DEFAULT_CHANNEL.mode },
      { new: true, upsert: true, setDefaultsOnInsert: true}, callback);
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

  function getById(conversationId, callback) {
    Conversation.findById(conversationId).exec(callback);
  }

  function getChannels(options, callback) {
    Conversation.find({mode: CONVERSATION_MODE.CHANNEL, moderate: Boolean(options.moderate)}).exec((err, channels) => {
      channels = channels || [];
      if (channels.length === 0) {
        return createDefaultChannel((err, channel) => {
          if (err) {
            return callback(new Error('Can not create the default channel'));
          }
          callback(null, [channel]);
        });
      }
      callback(err, channels);
    });
  }

  function init(callback) {
    createDefaultChannel(callback);
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
    const mode = options.mode;
    const type = options.type;
    const ignoreMemberFilterForChannel = options.ignoreMemberFilterForChannel;
    const exactMembersMatch = options.exactMembersMatch;
    const members = options.members;
    const name = options.name;
    const moderate = Boolean(options.moderate);

    if (exactMembersMatch && !members) {
      return callback(new Error('Could not set exactMembersMatch to true without providing members'));
    }

    if (ignoreMemberFilterForChannel && !members) {
      return callback(new Error('Could not set ignoreMemberFilterForChannel to true without providing members'));
    }

    let request = {moderate: moderate};

    if (members) {
      request.members = {
        $all: members.map(member => ({$elemMatch: {'member.objectType': member.member.objectType, 'member.id': member.member.id}}))
      };
    }

    if (mode) {
      request.mode = mode;
    }

    if (type) {
      request.type = type;
    }

    if (name) {
      request.name = name;
    }

    if (name === null) {
      request.$or = [{name: {$exists: false}}, {name: null}];
    }

    if (ignoreMemberFilterForChannel && (!type || type === CONVERSATION_TYPE.OPEN)) {
      delete request.moderate;
      request = {
        $or: [request, {
          type: CONVERSATION_TYPE.OPEN
        }],
        moderate: moderate
      };
    }

    if (exactMembersMatch) {
      request.members.$size = members.length;
    }

    Conversation.find(request).populate('last_message.creator', SKIP_FIELDS.USER).populate('last_message.user_mentions', SKIP_FIELDS.USER).sort('-last_message.date').exec(callback);
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

      conversationQuery.sort(sort).populate('creator last_message.creator', CONSTANTS.SKIP_FIELDS.USER).exec((err, conversations) => {
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

  function listForUser(user, options, callback) {
    Conversation.find({'members.member.id': String(user._id), 'members.member.objectType': OBJECT_TYPES.USER}).exec(callback);
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

  function update(conversationId, modifications, callback) {
    const mongoModifications = {};

    mongoModifications.$set = {};
    if (modifications.name) {
      mongoModifications.$set.name = modifications.name;
    }

    if (modifications.avatar) {
      mongoModifications.$set.avatar = new ObjectId(modifications.avatar);
    }

    Conversation.findOneAndUpdate({_id: conversationId}, mongoModifications, callback);
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
      if (!err) {
        channelTopicUpdateTopic.publish({conversationId: conversationId, topic: topic});
        topicUpdateTopic.publish({conversationId: conversationId, userId: topic.creator, old_topic: conversation.topic.value, topic: topic.value});
      }

      callback(err, conversation);
    });
  }
};
