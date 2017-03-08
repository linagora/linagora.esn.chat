'use strict';

const CONSTANTS = require('../../constants');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const leaveMembershipTopic = pubsub.local.topic(CONSTANTS.NOTIFICATIONS.COLLABORATION_LEAVE);
  const memberLeftTopic = pubsub.global.topic(CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION);

  return {
    start
  };

  function start() {
    leaveMembershipTopic.subscribe(event => {
      logger.debug('Collaboration leave conversation handler received an event');

      if (event.collaboration.objectType !== CONSTANTS.OBJECT_TYPES.CONVERSATION) {
        logger.debug(`Collaboration ${event.collaboration.id} is not a conversation, skipping`);

        return;
      }

      memberLeftTopic.publish({userId: event.target, conversationId: event.collaboration.id});
    });
  }
};
