'use strict';

const CONSTANTS = require('../../constants');
const Q = require('q');

module.exports = function(dependencies, lib) {
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
      logger.debug('System join conversation handler received an event', event);

      if (event.collaboration.objectType !== CONSTANTS.OBJECT_TYPES.CONVERSATION) {
        return Q.when();
      }

      return userHasJoined(event.target, event.collaboration.id);
    });
  }

  function userHasJoined(userId, conversationId, timestamp = Date.now()) {
    return Q.denodeify(lib.conversation.getById)(conversationId).then(conversation => {
      const event = {
        room: conversation.domain,
        message: {
          text: `@${userId} has joined the conversation.`,
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

      return event;
    });
  }
};
