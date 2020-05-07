'use strict';

const Q = require('q');
const CONSTANTS = require('../lib/constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
const CONVERSATION_ARCHIVED = CONSTANTS.NOTIFICATIONS.CONVERSATION_ARCHIVED;
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;
const CONVERSATION_SAVED = CONSTANTS.NOTIFICATIONS.CONVERSATION_SAVED;
const MEMBER_READ_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_READ_CONVERSATION;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const DEFAULT_CHANNEL = { name: CONSTANTS.DEFAULT_CHANNEL.name, type: CONSTANTS.DEFAULT_CHANNEL.type, mode: CONSTANTS.DEFAULT_CHANNEL.mode };
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const Conversation = mongoose.model('ChatConversation');
  const ArchivedConversation = mongoose.model('ChatArchivedConversation');
  const pubsubGlobal = dependencies('pubsub').global;
  const pubsubLocal = dependencies('pubsub').local;
  const channelArchivedLocalTopic = pubsubLocal.topic(CONVERSATION_ARCHIVED);
  const channelCreationTopic = pubsubGlobal.topic(CONVERSATION_CREATED);
  const channelTopicUpdateTopic = pubsubGlobal.topic(CONVERSATION_TOPIC_UPDATED);
  const channelReadTopic = pubsubGlobal.topic(MEMBER_READ_CONVERSATION);
  const topicUpdateTopic = pubsubLocal.topic(CONVERSATION_TOPIC_UPDATED);
  const channelSavedTopic = pubsubLocal.topic(CONVERSATION_SAVED);
  const permission = require('./permission/conversation')(dependencies);
  const utils = require('./utils')(dependencies);
  const userConversationsFinders = [];

  return {
    archive,
    create,
    createDefaultChannel,
    find,
    getAllForUser,
    getById,
    getDefaultChannel,
    getOpenChannels,
    increaseNumberOfUnseenMentionsOfMembers,
    list,
    listForUser,
    listByCursor,
    moderate,
    markUserAsReadAllMessages,
    permission,
    registerUserConversationFinder,
    update,
    updateTopic
  };

  function archive(conversation, user) {
    const archivedConversationJSON = conversation.toObject();

    delete archivedConversationJSON.__v;

    archivedConversationJSON.archived = {by: utils.ensureObjectId(user._id)};

    const archivedConversation = new ArchivedConversation(archivedConversationJSON);

    return archivedConversation.save()
    .then(archivedConversation =>
     Conversation.deleteOne({_id: utils.ensureObjectId(conversation._id)}).then(() => archivedConversation)
    )
    .then(archivedConversation => {
      publishArchivedConversation(archivedConversation);

      return true;
    });
  }

  function create(options, callback) {
    if (options && options.members) {
      options.members.map(member => {
        member.member.id = utils.ensureObjectId(member.member.id);

        return member;
      });
    }

    if (options && options.domain_ids) {
      options.domain_ids = options.domain_ids.map(domainId => utils.ensureObjectId(domainId));
    }

    const conversation = new Conversation(options);

    conversation.save((err, saved) => {
      if (!err) {
        publishNewConversation(saved);
      }
      callback(err, saved);
    });
  }

  function createDefaultChannel(options, callback) {
    const query = Object.assign(DEFAULT_CHANNEL, {domain_ids: [options.domainId]});

    Conversation.findOneAndUpdate(
      query,
      query,
      { new: true, upsert: true, setDefaultsOnInsert: true, rawResult: true },
      (err, conversation) => {
        if (!err && !conversation.lastErrorObject.updatedExisting) {
          publishNewConversation(conversation.value);
        }
        callback(err, conversation.value);
      }
    );
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

  function getDefaultChannel(options, callback) {
    const query = Object.assign(DEFAULT_CHANNEL, {domain_ids: [options.domainId]});

    Conversation.findOne(query).exec(callback);
  }

  function getOpenChannels(options, callback) {
    Conversation.find({type: CONVERSATION_TYPE.OPEN, mode: CONVERSATION_MODE.CHANNEL, moderate: Boolean(options.moderate)})
      .sort('name')
      .exec(callback);
  }

  /**
   * Find conversations.
   *
   * @param {string|[string]} options.type - allowed types if none provided all type are accepted
   * @param {boolean} options.ignoreMemberFilterForChannel - if true and if channel aren't excluded by the previous argument, all channel will be included even if they do not match the members filter.
   *    This makes sense because everybody can access channels even if there are not member of it.
   * @param {boolean} options.exactMembersMatch - if true only conversations that has exactly the same members will be filtered out otherwise only conversations that contains at least the provided members will be selected
   * @param {[string]} options.members of members' id
   * @param {string} options.name is undefined the conversation can have any name or no name. If null the conversation should have no name, if it's a string the conversation should have
   * @param {Boolean} options.unread if true, search only conversations that members have unread messages
   * @param {Object} options.populations populations now supports the values below:
   *                                       + "lastMessageCreator": if true will populate creator of last_message
   *                                       + "lastMessageMentionedUsers": if true will populate mentioned users in last_message
   * @param {String|Object} options.sort sort order
   * @return {[Conversation]}
   */
  function find(options, callback) {
    const {
      mode,
      type,
      ignoreMemberFilterForChannel,
      exactMembersMatch,
      members,
      name,
      unread,
      populations,
      sort
    } = options;

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
        $all: members.map(member => ({$elemMatch: {'member.objectType': member.member.objectType, 'member.id': utils.ensureObjectId(member.member.id)}}))
      };

      if (unread) {
        Object.assign(request, _buildUnreadQuery(members));
      }
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

    const query = Conversation.find(request);

    if (populations) {
      query.populate(_buildPopulations(populations));
    }

    if (sort) {
      query.sort(sort);
    }

    query.exec(callback);
  }

  function _buildUnreadQuery(members) {
    const query = {};
    const unreadExpressions = members.map(member => `(!this.memberStates || !this.memberStates["${member.member.id}"] || !isNumber(this.memberStates["${member.member.id}"].numOfReadMessages) || this.memberStates["${member.member.id}"].numOfReadMessages < this.numOfMessage)`);

    unreadExpressions.unshift('this.numOfMessage > 0');
    query.$where = unreadExpressions.join(' && ');

    return query;
  }

  function _buildPopulations(populations) {
    const mongoPopulations = [];

    if (populations.lastMessageCreator) {
      mongoPopulations.push({
        path: 'last_message.creator',
        select: SKIP_FIELDS.USER
      });
    }

    if (populations.lastMessageMentionedUsers) {
      mongoPopulations.push({
        path: 'last_message.user_mentions',
        select: SKIP_FIELDS.USER
      });
    }

    return mongoPopulations;
  }

  function list(options, callback) {
    const query = {};
    const sort = 'timestamps.creation';

    options = options || {};
    options.limit = +(options.limit || CONSTANTS.DEFAULT_LIMIT);
    options.offset = +(options.offset || CONSTANTS.DEFAULT_OFFSET);
    options.moderate = Boolean(options.moderate);

    if (options.creator) {
      query.creator = options.creator;
    }

    if (options.mode) {
      query.mode = options.mode;
    }

    if (options.type) {
      query.type = options.type;
    }

    if (options.domain_ids) {
      query.domain_ids = options.domain_ids;
    }

    query.moderate = options.moderate;

    let conversationQuery = Conversation.find(query);

    Conversation.find(conversationQuery).estimatedDocumentCount().exec((err, count) => {
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
    Conversation.find({'members.member.id': utils.ensureObjectId(user._id), 'members.member.objectType': OBJECT_TYPES.USER}).exec(callback);
  }

  function listByCursor() {
    return Conversation.find().cursor();
  }

  function moderate(conversationId, moderate, callback) {
    Conversation.findByIdAndUpdate(conversationId, {
      $set: {moderate: moderate}
    }, {
      new: true
    }, callback);
  }

  function publishArchivedConversation(archivedConversation) {
    channelArchivedLocalTopic.forward(pubsubGlobal, JSON.parse(JSON.stringify(archivedConversation)));
  }

  function publishNewConversation(conversation) {
    channelCreationTopic.publish(JSON.parse(JSON.stringify(conversation)));
    channelSavedTopic.publish(conversation);
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
    }, (err, conversation) => {
      if (!err) {
        channelTopicUpdateTopic.publish({conversationId: conversationId, topic: topic});
        topicUpdateTopic.publish({conversationId: conversationId, userId: topic.creator, old_topic: conversation.topic.value, topic: topic.value});
      }

      callback(err, conversation);
    });
  }

  function increaseNumberOfUnseenMentionsOfMembers(conversationId, mentionedMemberIds) {
    const increasingQuery = {};

    mentionedMemberIds.forEach(mentionedMemberId => {
      increasingQuery[`memberStates.${mentionedMemberId}.numOfUnseenMentions`] = 1;
    });

    return Conversation.findByIdAndUpdate(conversationId, { $inc: increasingQuery });
  }

  function markUserAsReadAllMessages(userId, conversation, callback) {
    const updates = {
      [`memberStates.${String(userId)}.numOfReadMessages`]: conversation.numOfMessage,
      [`memberStates.${String(userId)}.numOfUnseenMentions`]: 0
    };

    return Conversation.findByIdAndUpdate(conversation._id, updates, err => {
      if (!err) {
        channelReadTopic.publish({
          userId,
          conversationId: conversation._id
        });
      }

      callback(err);
    });
  }
};
