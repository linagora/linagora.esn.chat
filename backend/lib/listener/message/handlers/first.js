'use strict';

const CONSTANTS = require('../../../constants');

module.exports = function(dependencies) {

  const pubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const conversationLib = require('../../../conversation')(dependencies);
  const messageLib = require('../../../message')(dependencies);

  return function(data) {
    const channel = data.message.channel;

    messageLib.count(channel, (err, count) => {
      if (err) {
        return logger.error('Can not count messages in channel %s', channel, err);
      }

      if (count === 1) {
        conversationLib.getById(channel, (err, conversation) => {
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
