'use strict';

const CONSTANTS = require('../../constants');
const Q = require('q');

module.exports = function(dependencies, lib) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub').local;
  const newMessageTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
  const membershipTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.MEMBERSHIP_EVENTS);

  return {
    start,
    userHasJoined
  };

  function start() {
    membershipTopic.subscribe(event => {
      logger.debug('System join conversation handler received an event', event);

      if (CONSTANTS.MEMBERSHIP_ACTION.JOIN === event.type) {
        return userHasJoined(event.userId, event.conversationId, event.timestamp);
      }

      return Q.when();
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
