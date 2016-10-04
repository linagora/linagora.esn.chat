'use strict';

const _ = require('lodash');
const CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  const localPubsub = dependencies('pubsub').local;
  const globalPubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  let forwardHandlers = {};
  let messageHandlers = [];

  return {
    addForwardHandler,
    addHandler,
    handleMessage,
    start
  };

  function addForwardHandler(type, handler) {
    forwardHandlers[type] = handler;
  }

  function addHandler(handler) {
    handler && messageHandlers.push(handler);
  }

  function forwardMessage(room, message) {
    let handler = getForwardHandler(message.type);

    if (!handler) {
      return logger.error('Can not find a valid forward handler for message of type %s', message.type);
    }

    handler(message, (err, message) => {
      if (err) {
        return logger.error('Can not forward message', err);
      }

      publish({room, message});
    });
  }

  function getForwardHandler(type) {
    return forwardHandlers[type];
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

  function isForwardable(message) {
    return !!forwardHandlers[message.type];
  }

  function publish(data) {
    globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish(data);
  }

  function start(lib) {
    addHandler(require('./handlers/first')(dependencies));
    addHandler(require('./handlers/mentions')(dependencies));
    addForwardHandler(CONSTANTS.MESSAGE_TYPE.USER_TYPING, require('./forward/user-typing')(dependencies));

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(onMessageReceived);

    function onMessageReceived(data) {
      if (isForwardable(data.message)) {
        return forwardMessage(data.room, data.message);
      }

      saveAsChatMessage(data, (err, message) => {
        if (err) {
          return logger.error('Can not save ChatMessage', err);
        }
        logger.debug('Chat Message saved', message);
        publish({room: data.room, message: message});

        handleMessage({message: message, room: data.room});
      });
    }

    function saveAsChatMessage(data, callback) {
      lib.conversation.getById(data.message.channel._id || data.message.channel, (err, conversation) => {
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

        lib.message.create(chatMessage, callback);
      });
    }
  }
};
