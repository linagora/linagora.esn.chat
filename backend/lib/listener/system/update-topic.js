'use strict';

const CONSTANTS = require('../../constants');
const Q = require('q');

module.exports = function(dependencies, lib) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub').local;
  const newMessageTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
  const topicUpdatedTopic = pubsub.topic(CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED);

  return {
    start,
    topicUpdated
  };

  function start() {
    topicUpdatedTopic.subscribe(event => {
      logger.debug('System topic update handler received an event', event);

      return topicUpdated(event.conversationId, event.userId, event.old_topic, event.topic, event.timestamp);
    });
  }

  function topicUpdated(conversationId, userId, oldTopicName, newTopicName, timestamp = Date.now()) {

    return Q.denodeify(lib.conversation.getById)(conversationId).then(conversation => {
      const event = {
        room: conversation.domain,
        message: {
          text: oldTopicName ? `@${userId} updated the conversation topic from ${oldTopicName} to ${newTopicName}.` : `@${userId} had set the conversation topic to ${newTopicName}.`,
          type: 'text',
          subtype: CONSTANTS.MESSAGE_SUBTYPE.TOPIC_UPDATE,
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
