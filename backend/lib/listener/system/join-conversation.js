'use strict';

const CONSTANTS = require('../../constants');

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub').local;
  const newMessageTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
  const membershipTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.COLLABORATION_JOIN);

  return {
    start,
    userHasJoined
  };

  function start() {
    membershipTopic.subscribe(event => {
      logger.debug('System join conversation handler received an event');

      if (event.collaboration.objectType !== CONSTANTS.OBJECT_TYPES.CONVERSATION) {
        logger.debug(`Collaboration ${event.collaboration.id} is not a conversation, skipping`);

        return;
      }

      return userHasJoined(event.target, event.collaboration.id);
    });
  }

  function userHasJoined(userId, conversationId, timestamp = Date.now()) {
    const event = {
      message: {
        text: `<%@${userId}%> has joined the conversation.`,
        type: 'text',
        subtype: CONSTANTS.MESSAGE_SUBTYPE.CONVERSATION_JOIN,
        creator: userId,
        channel: conversationId,
        user_mentions: [userId],
        timestamps: {
          creation: timestamp
        }
      }
    };

    newMessageTopic.publish(event);
  }
};
