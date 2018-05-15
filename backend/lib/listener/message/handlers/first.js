'use strict';

const CONSTANTS = require('../../../constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;

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

          if (!conversation) {
            return logger.error(`No such conversation ${channel}`);
          }

          conversation.members && conversation.members.filter(member => (member.member.objectType === OBJECT_TYPES.USER && String(member.member.id) !== String(data.message.creator._id)))
          .forEach(member => {
            pubsub.topic(CONSTANTS.NOTIFICATIONS.CONVERSATION_INITIALIZED).publish({message: data.message, conversation: conversation.toObject(), target: member});
          });
        });
      }
    });
  };

};
