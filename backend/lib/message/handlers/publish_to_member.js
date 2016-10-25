'use strict';

var CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  var pubsub = dependencies('pubsub').local;
  var logger = dependencies('logger');
  var conversationLib = require('../../conversation')(dependencies);

  return function(data) {
    var channel = data.message.channel;

    conversationLib.getConversation(channel, function(err, conversation) {
      if (err) {
        return logger.error('Can not get channel %s', channel, err);
      }

      if (!conversation) {
        return logger.error('No such conversation %s', channel);
      }

      conversation.members && conversation.members.filter(function(member) {
        return String(member._id) !== String(data.message.creator._id);
      }).forEach(function(member) {
        pubsub.topic(CONSTANTS.NOTIFICATIONS.NEW_CHAT_MESSAGE).publish({room: data.room, message: data.message, conversation: conversation.toObject(), target: member});
      });
    });
  };
};
