'use strict';

const CONSTANTS = require('../../constants');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const joinMembershipTopic = pubsub.local.topic(CONSTANTS.NOTIFICATIONS.COLLABORATION_JOIN);
  const memberAddedTopic = pubsub.global.topic(CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION);

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

      //author, target
      if (event.author === event.target) {
        logger.debug(`Event author and target are the same for ${event.collaboration.id}, skipping`);

        return;
      }

      memberAddedTopic.publish({userId: event.target, authorId: event.author, conversationId: event.collaboration.id});
    });
  }
};
