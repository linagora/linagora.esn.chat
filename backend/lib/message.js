'use strict';

const async = require('async');
const _ = require('lodash');
const CONSTANTS = require('../lib/constants');
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const Conversation = mongoose.model('ChatConversation');
  const ChatMessage = mongoose.model('ChatMessage');

  return {
    count,
    create,
    getById,
    getForConversation,
    list,
    markAllAsReadById,
    markAllAsRead,
    moderate,
    parseMention
  };

  function count(conversation, callback) {
    ChatMessage.count({channel: conversation}, callback);
  }

  function create(message, callback) {
    parseMention(message);
    let chatMessage = new ChatMessage(message);

    async.waterfall([
      save, updateLastMessage, markAsRead, populate,
      function(message, callback) {
        callback(null, message.toJSON());
      }
    ], callback);

    function save(callback) {
      chatMessage.save(callback);
    }

    function updateLastMessage(message, _num, callback) {
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
      }, (err, conversation) => {
        if (err) {
          logger.error('Can not update channel with last_update', err);
        }
        callback(null, message, conversation);
      });
    }

    function markAsRead(message, conversation, callback) {
      markAllAsRead(message.creator, conversation, err => {
        callback(err, message);
      });
    }

    function populate(message, callback) {
      ChatMessage.populate(message, [{path: 'user_mentions'}, {path: 'creator'}], callback);
    }
  }

  function getById(messageId, callback) {
    ChatMessage.findById(messageId).populate('creator user_mentions', SKIP_FIELDS.USER).exec(callback);
  }

  function getForConversation(conversation, query, callback) {
    query = query || {};

    if (!query.moderate) {
      query.moderate = false;
    }

    let conversationId = conversation._id || conversation;
    let q = {channel: conversationId, moderate: false};
    let mq = ChatMessage.find(q);

    mq.populate('creator', SKIP_FIELDS.USER);
    mq.populate('user_mentions', SKIP_FIELDS.USER);
    mq.limit(+query.limit || 20);
    mq.skip(+query.offset || 0);
    mq.sort('-timestamps.creation');
    mq.exec((err, result) => {
      if (!err) {
        result.reverse();
      }

      callback(err, result);
    });
  }

  function list(options, callback) {
    let query;
    let sort = 'timestamps.creation';

    options = options || {};
    options.limit = +(options.limit || CONSTANTS.DEFAULT_LIMIT);
    options.offset = +(options.offset || CONSTANTS.DEFAULT_OFFSET);

    if (options.creator) {
      query = query || {};
      query.creator = options.creator;
    }

    let messageQuery = query ? ChatMessage.find(query) : ChatMessage.find();

    ChatMessage.find(messageQuery).count().exec((err, count) => {
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

  function markAllAsRead(userIds, conversation, callback) {
    userIds = _.isArray(userIds) ? userIds : [userIds];
    let updateMaxOperation = {};

    userIds.forEach(function(userId) {
      updateMaxOperation['numOfReadedMessage.' + String(userId)] = conversation.numOfMessage;
    });

    Conversation.findByIdAndUpdate(conversation._id, {
      $max: updateMaxOperation
    }, callback);
  }

  function markAllAsReadById(userId, conversationId, callback) {
    Conversation.findOne({_id: conversationId}, function(err, conversation) {
      if (err) {
        return callback(err);
      }

      markAllAsRead(userId, conversation, callback);
    });
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

};
