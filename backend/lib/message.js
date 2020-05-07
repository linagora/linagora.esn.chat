'use strict';

const async = require('async');
const Q = require('q');
const _ = require('lodash');
const CONSTANTS = require('../lib/constants');
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub').local;
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const Conversation = mongoose.model('ChatConversation');
  const ChatMessage = mongoose.model('ChatMessage');
  const resourceLink = dependencies('resourceLink');

  return {
    count,
    create,
    getAttachmentsForConversation,
    getById,
    getByIdAndPopulate,
    getForConversation,
    list,
    listByCursor,
    moderate,
    parseMention,
    save,
    searchForUser,
    isStarredBy
  };

  function count(conversationId, callback) {
    ChatMessage.countDocuments({channel: conversationId}, callback);
  }

  function create(message, callback) {
    parseMention(message);

    async.waterfall([
      saveMessage, updateLastMessage, markAsRead, populate,
      function(message, callback) {
        callback(null, message.toJSON());
      }
    ], callback);

    function saveMessage(callback) {
      save(message, callback);
    }

    function updateLastMessage(message, callback) {
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
      }, { new: true }, (err, conversation) => {
        if (err) {
          logger.error('Can not update channel with last_update', err);
        }
        callback(null, message, conversation);
      });
    }

    function markAsRead(message, conversation, callback) {
      if (!conversation) {
        return callback(null, message);
      }

      lib.conversation.markUserAsReadAllMessages(message.creator, conversation, err => {
        callback(err, message);
      });
    }

    function populate(message, callback) {
      ChatMessage.populate(message, [{path: 'user_mentions'}, {path: 'creator'}], callback);
    }
  }

  function getAttachmentsForConversation(conversationId, query = {}, callback) {
    const offset = parseInt(query.offset || CONSTANTS.DEFAULT_OFFSET, 10);
    const limit = parseInt(query.limit || CONSTANTS.DEFAULT_LIMIT, 10);
    const sort = parseInt(query.sort || -1, 10);

    const mongoQuery = ChatMessage.aggregate([
      { $match: {channel: conversationId, moderate: false, attachments: { $gt: [] }} },
      { $unwind: '$attachments' },
      { $skip: offset },
      { $limit: limit },
      { $group: {
        _id: '$attachments._id',
        message_id: { $first: '$_id' },
        creator: { $first: '$creator' },
        creation_date: { $first: '$timestamps.creation' },
        name: { $first: '$attachments.name' },
        contentType: { $first: '$attachments.contentType' },
        length: { $first: '$attachments.length' }
      }},
      { $sort: { creation_date: sort, name: sort} }
    ]);

    mongoQuery.exec((err, result) => {
      if (!err) {
        result.reverse();
      }
      callback(err, result);
    });
  }

  function getById(messageId, callback) {
    Q(getByIdAndPopulate(messageId, ['creator', 'user_mentions'])).nodeify(callback);
  }

  function getByIdAndPopulate(messageId, populateFields = []) {
    return ChatMessage.findById(messageId).populate(populateFields.join(' '), SKIP_FIELDS.USER);
  }

  function getForConversation(conversation, query = {limit: CONSTANTS.DEFAULT_LIMIT, offset: CONSTANTS.DEFAULT_OFFSET}, callback) {

    function getMessages(mongoQuery, callback) {
      mongoQuery.exec((err, result) => {
        if (!err) {
          result.reverse();
        }
        callback(err, result);
      });
    }

    if (!query.moderate) {
      query.moderate = false;
    }

    const conversationId = conversation._id || conversation;
    const q = {channel: conversationId, moderate: false};
    const mq = ChatMessage.find(q);

    mq.populate('creator', SKIP_FIELDS.USER);
    mq.populate('user_mentions', SKIP_FIELDS.USER);
    mq.limit(+query.limit);
    mq.skip(+query.offset);
    mq.sort('-timestamps.creation');

    if (query.before) {
      ChatMessage.findById(query.before).exec((err, before) => {
        if (err) {
          logger.error('Error while searching message %s', query.before, err);

          return callback(err);
        }

        if (!before) {
          return getMessages(mq, callback);
        }

        mq.where({'timestamps.creation': {$lt: before.timestamps.creation}});

        return getMessages(mq, callback);
      });
    } else {
      return getMessages(mq, callback);
    }
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

    const messageQuery = query ? ChatMessage.find(query) : ChatMessage.find();

    ChatMessage.find(messageQuery).countDocuments().exec((err, count) => {
      if (err) {
        return callback(err);
      }

      let messageQuery = query ? ChatMessage.find(query) : ChatMessage.find();

      messageQuery = messageQuery.skip(options.offset);

      if (options.limit > 0) {
        messageQuery = messageQuery.limit(options.limit);
      }

      messageQuery.sort(sort).populate('creator', CONSTANTS.SKIP_FIELDS.USER).exec((err, messages) => {
        if (err) {
          return callback(err);
        }
        callback(null, {
          total_count: count,
          list: messages || []
        });
      });
    });
  }

  function listByCursor() {
    return ChatMessage.find().cursor();
  }

  function moderate(messageId, moderate, callback) {
    ChatMessage.findByIdAndUpdate(messageId, {
      $set: {moderate: moderate}
    }, {
      new: true
    }, callback);
  }

  function parseMention(message) {
    message.user_mentions = _.uniq(message.text.match(/@[a-fA-F0-9]{24}/g)).map(function(mention) {
      return new ObjectId(mention.replace(/^@/, ''));
    });
  }

  function save(message, callback) {
    ChatMessage.create(message, (err, created) => {
      if (!err) {
        pubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_SAVED).publish(created);
      }
      callback(err, created);
    });
  }

  function searchForUser(user, query, callback) {
    lib.conversation.getAllForUser(user).then(conversations => {
      lib.search.messages.search.searchInConversations(query, conversations.map(conversation => String(conversation._id)), callback);
    }, err => {
      logger.error('Can not search messages for user', err);
      callback(err);
    });
  }

  function isStarredBy(message, user) {
    const sourceTuple = {
      objectType: CONSTANTS.OBJECT_TYPES.USER,
      id: String(user._id)
    };
    const targetTuple = {
      objectType: CONSTANTS.OBJECT_TYPES.MESSAGE,
      id: String(message._id)
    };

    return resourceLink.exists({ source: sourceTuple, target: targetTuple, type: CONSTANTS.STAR_LINK_TYPE });
  }
};
