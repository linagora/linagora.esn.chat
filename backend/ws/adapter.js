'use strict';

const Q = require('q');
const CONSTANTS = require('../lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;

module.exports = (dependencies, lib) => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const globalPubsub = pubsub.global;
  const localPubsub = pubsub.local;

  return {
    bindEvents
  };

  function bindEvents(messenger) {
    globalPubsub.topic(CONVERSATION_CREATED).subscribe(messenger.conversationCreated);
    globalPubsub.topic(CONVERSATION_DELETED).subscribe(messenger.conversationDeleted);
    globalPubsub.topic(CONVERSATION_UPDATED).subscribe(data => messenger.conversationUpdated(data.conversation));
    globalPubsub.topic(CONVERSATION_TOPIC_UPDATED).subscribe(topicUpdated);
    globalPubsub.topic(MEMBER_ADDED_IN_CONVERSATION).subscribe(messenger.newMemberAdded);
    globalPubsub.topic(MESSAGE_RECEIVED).subscribe(sendMessage);

    messenger.on('message', message => localPubsub.topic(MESSAGE_RECEIVED).publish({message}));

    function getConversation(id) {
      return Q.denodeify(lib.conversation.getById)(id).then(conversation => {
        if (!conversation) {
          throw new Error(`Can not find conversation ${id}`);
        }

        return conversation;
      });
    }

    // Event payload is { room, message }
    function sendMessage(event) {
      getConversation(event.message.channel)
        .then(conversation => {
          messenger.sendMessage(conversation, event.message);
        })
        .catch(err => {
          logger.error('Error while getting conversation to send message', err);
        });
    }

    /**
    * Event payload is {conversationId: conversationId, topic: topic}
    */
    function topicUpdated(event) {
      getConversation(event.conversationId)
        .then(messenger.topicUpdated)
        .catch(err => {
          logger.error('Error while getting conversation for topic update', err);
      });
    }
  }
};
