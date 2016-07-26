'use strict';

var CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  var pubsub = dependencies('pubsub').global;
  var logger = dependencies('logger');
  var conversationLib = require('../../conversation')(dependencies);

  return function(data) {
    var channel = data.message.channel;

    conversationLib.countMessages(channel, function(err, count) {
      if (err) {
        return logger.error('Can not count messages in channel %s', channel, err);
      }

      if (count === 1) {
        conversationLib.getConversation(channel, function(err, conversation) {
          if (err) {
            return logger.error('Can not get channel %s', channel, err);
          }

          conversation.members && conversation.members.filter(function(member) {
            return String(member._id) !== String(data.message.creator._id);
          }).forEach(function(member) {
            pubsub.topic(CONSTANTS.NOTIFICATIONS.CONVERSATION_INITIALIZED).publish({room: data.room, message: data.message, conversation: conversation.toObject(), target: member});
          });
        });
      }
    });
  };

};
