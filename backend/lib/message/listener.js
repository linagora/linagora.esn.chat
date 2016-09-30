'use strict';

const CONSTANTS = require('../constants');
let _ = require('lodash');

module.exports = function(dependencies) {

  let localPubsub = dependencies('pubsub').local;
  let globalPubsub = dependencies('pubsub').global;
  let logger = dependencies('logger');

  let mongoose = dependencies('db').mongo.mongoose;
  let ChatMessage = mongoose.model('ChatMessage');
  let messageHandlers = [];

  function addHandler(handler) {
    handler && messageHandlers.push(handler);
  }

  function handleMessage(data) {
    messageHandlers.map(handler => {
      try {
        handler(data);
      } catch (err) {
        logger.warn('Error while handling message', err);
      }
    });
  }

  function start(conversationLib) {
    addHandler(require('./handlers/first')(dependencies));
    addHandler(require('./handlers/mentions')(dependencies));

    function saveAsChatMessage(data, callback) {
      conversationLib.getConversation(data.message.channel._id || data.message.channel, (err, conversation) => {
        if (err) {
          return callback(err);
        }

        if (conversation.type !== CONSTANTS.CONVERSATION_TYPE.CHANNEL && !_.find(conversation.members, function(member) {
          return String(member._id) === String(data.message.creator._id || data.message.creator);
        })) {
          return callback('The user is not into the conversation and this conversation is not public');
        }

        let chatMessage = {
          type: data.message.type,
          text: data.message.text,
          date: data.message.date,
          creator: data.message.creator,
          channel: data.message.channel
        };

        if (data.message.attachments) {
          chatMessage.attachments = data.message.attachments;
        }

        conversationLib.createMessage(chatMessage, callback);
      });
    }

    function populateTypingMessage(data, callback) {
      (new ChatMessage(data)).populate('creator', CONSTANTS.SKIP_FIELDS.USER, (err, message) => {
        if (err) {
          callback(err);

          return;
        }
        let result = message.toJSON();

        result.state = data.state;
        callback(null, result);
      });
    }

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(data => {
      if (data.message.type === 'user_typing') {
        populateTypingMessage(data.message, function(err, message) {
          if (err) {
            logger.error('Can not populate user typing message', err);

            return;
          }
          globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: data.room, message: message});
        });
      } else {
        saveAsChatMessage(data, (err, message) => {
          if (err) {
            logger.error('Can not save ChatMessage', err);

            return;
          }
          logger.debug('Chat Message saved', message);
          globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: data.room, message: message});

          handleMessage({message: message, room: data.room});
        });
      }
    });
  }

  return {
    start,
    addHandler,
    handleMessage
  };
};
