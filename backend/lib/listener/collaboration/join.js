'use strict';

const CONSTANTS = require('../../constants');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const joinMembershipTopic = pubsub.local.topic(CONSTANTS.NOTIFICATIONS.COLLABORATION_JOIN);
  const memberJoinedTopic = pubsub.global.topic(CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION);

  return {
    start
  };

  function start() {
    joinMembershipTopic.subscribe(event => {
      logger.debug('Collaboration join conversation handler received an event');

      if (event.collaboration.objectType !== CONSTANTS.OBJECT_TYPES.CONVERSATION) {
        logger.debug(`Collaboration ${event.collaboration.id} is not a conversation, skipping`);

        return;
      }

      memberJoinedTopic.publish({userId: event.target, conversationId: event.collaboration.id});
    });
  }
};
