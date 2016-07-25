'use strict';

var CONSTANTS = require('../constants');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var globalPubsub = dependencies('pubsub').global;
  var logger = dependencies('logger');

  var mongoose = dependencies('db').mongo.mongoose;
  var ChatMessage = mongoose.model('ChatMessage');

  var messageHandlers = [];

  function addHandler(handler) {
    handler && messageHandlers.push(handler);
  }

  function handleMessage(data) {
    messageHandlers.map(function(handler) {
      try {
        handler(data);
      } catch (err) {
        logger.warn('Error while handling message', err);
      }
    });
  }

  function start(channel) {

    addHandler(require('./handlers/first')(dependencies));
    addHandler(require('./handlers/mentions')(dependencies));

    function saveAsChatMessage(data, callback) {
      var chatMessage = {
        type: data.message.type,
        text: data.message.text,
        date: data.message.date,
        creator: data.message.creator,
        channel: data.message.channel
      };

      if (data.message.attachments) {
        chatMessage.attachments = data.message.attachments;
      }

      channel.createMessage(chatMessage, callback);
    }

    function populateTypingMessage(data, callback) {
      (new ChatMessage(data)).populate('creator', function(err, message) {
        if (err) {
          callback(err);
          return;
        }
        var result = message.toJSON();

        result.state = data.state;
        callback(null, result);
      });
    }

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if (data.message.type === 'user_typing') {
        populateTypingMessage(data.message, function(err, message) {
          if (err) {
            logger.error('Can not populate user typing message', err);
            return;
          }
          globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: data.room, message: message});
        });
      } else {
        saveAsChatMessage(data, function(err, message) {
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
    start: start,
    addHandler: addHandler,
    handleMessage: handleMessage
  };
};
