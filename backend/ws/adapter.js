'use strict';

const Q = require('q');
const CONSTANTS = require('../lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_TO_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION;
const MEMBER_JOINED_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION;
const MEMBER_LEFT_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;
const MEMBER_READ_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_READ_CONVERSATION;
const MEMBER_UNSUBSCRIBED_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_UNSUBSCRIBED_CONVERSATION;

module.exports = (dependencies, lib) => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const globalPubsub = pubsub.global;
  const localPubsub = pubsub.local;

  return {
    bindEvents
  };

  function bindEvents(messenger) {
    globalPubsub.topic(CONVERSATION_CREATED).subscribe(messenger.conversationCreated.bind(messenger));
    globalPubsub.topic(CONVERSATION_DELETED).subscribe(messenger.conversationDeleted.bind(messenger));
    globalPubsub.topic(CONVERSATION_UPDATED).subscribe(data => messenger.conversationUpdated.bind(messenger)(data.conversation));
    globalPubsub.topic(CONVERSATION_TOPIC_UPDATED).subscribe(topicUpdated);
    globalPubsub.topic(MEMBER_ADDED_TO_CONVERSATION).subscribe(memberHasBeenAdded);
    globalPubsub.topic(MEMBER_JOINED_CONVERSATION).subscribe(memberHasJoined);
    globalPubsub.topic(MEMBER_LEFT_CONVERSATION).subscribe(memberHasLeft);
    globalPubsub.topic(MESSAGE_RECEIVED).subscribe(sendMessage);
    globalPubsub.topic(MEMBER_READ_CONVERSATION).subscribe(memberHasRead);
    globalPubsub.topic(MEMBER_UNSUBSCRIBED_CONVERSATION).subscribe(data => messenger.memberHasUnsubscribed.bind(messenger)(data.userId, data.conversationIds));

    messenger.on('message', message => localPubsub.topic(MESSAGE_RECEIVED).publish({message}));

    function countMembers(conversation) {
      return lib.members.countMembers(conversation);
    }

    function getConversation(id) {
      return Q.denodeify(lib.conversation.getById)(id).then(conversation => {
        if (!conversation) {
          throw new Error(`Can not find conversation ${id}`);
        }

        return conversation;
      });
    }

    function getMember(userId) {
      return {
        member: {
          id: userId,
          objectType: CONSTANTS.OBJECT_TYPES.USER
        }
      };
    }

    // Event payload is {userId, authorId, conversationId}
    // userId: User added
    // authorId: User who added userId
    function memberHasBeenAdded(event) {
      return getConversation(event.conversationId)
        .then(conversation => messenger.memberHasBeenAdded.bind(messenger)(conversation, getMember(event.userId), getMember(event.authorId)))
        .catch(err => {
          logger.error(`Can not process the ${MEMBER_ADDED_TO_CONVERSATION} event correctly`, err);
          throw err;
        });
    }

    // Event payload is {userId, conversationId}
    function memberHasJoined(event) {
      return getConversation(event.conversationId)
        .then(conversation => countMembers(conversation)
        .then(count => messenger.memberHasJoined.bind(messenger)(conversation, getMember(event.userId), count)))
        .catch(err => {
          logger.error(`Can not process the ${MEMBER_JOINED_CONVERSATION} event correctly`, err);
          throw err;
        });
    }

    // Event payload is {userId, conversationId}
    function memberHasLeft(event) {
      return getConversation(event.conversationId)
        .then(conversation => countMembers(conversation)
        .then(count => messenger.memberHasLeft.bind(messenger)(conversation, getMember(event.userId), count)))
        .catch(err => {
          logger.error(`Can not process the ${MEMBER_LEFT_CONVERSATION} event correctly`, err);
          throw err;
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
        .then(conversation => {
          messenger.topicUpdated(conversation.toObject());
        })
        .catch(err => {
          logger.error('Error while getting conversation for topic update', err);
        });
    }

    /**
     * Event payload is {conversationId}
     */
    function memberHasRead(event) {
      messenger.sendDataToUser(event.userId, MEMBER_READ_CONVERSATION, {
        conversationId: event.conversationId
      });
    }
  }
};
