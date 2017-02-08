'use strict';

const CONSTANTS = require('../lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;

module.exports = dependencies => {
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
    globalPubsub.topic(TOPIC_UPDATED).subscribe(messenger.topicUpdated);
    globalPubsub.topic(MEMBER_ADDED_IN_CONVERSATION).subscribe(messenger.newMemberAdded);
    globalPubsub.topic(MESSAGE_RECEIVED).subscribe(data => messenger.sendMessage(data.room, data.message));

    messenger.on('message', message => localPubsub.topic(MESSAGE_RECEIVED).publish({room: message.room, message}));
  }
};
