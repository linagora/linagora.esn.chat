'use strict';

const EventEmitter = require('events').EventEmitter;

const CONSTANTS = require('../lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_TO_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION;
const MEMBER_JOINED_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION;
const MEMBER_LEFT_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;
const DEFAULT_ROOM = CONSTANTS.WEBSOCKET.DEFAULT_ROOM;
const MEMBER_UNSUBSCRIBED_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_UNSUBSCRIBED_CONVERSATION;

class Messenger extends EventEmitter {

  constructor(transport, options) {
    super();
    this.transport = transport;
    this.logger = options.dependencies('logger');
    this.listenToIncomingEvents();
  }

  conversationCreated(conversation) {
    this.sendDataToClients(conversation, CONVERSATION_CREATED, conversation);
  }

  conversationDeleted(conversation) {
    this.sendDataToClients(conversation, CONVERSATION_DELETED, conversation);
  }

  conversationUpdated(conversation) {
    this.sendDataToClients(conversation, CONVERSATION_UPDATED, conversation);
  }

  listenToIncomingEvents() {
    this.transport.on('message', message => {
      this.emit('message', message);
    });
  }

  memberHasBeenAdded(conversation, member, by_member) {
    this.sendDataToUser(member.member.id, MEMBER_ADDED_TO_CONVERSATION, {conversation, member, by_member});
  }

  memberHasJoined(conversation, member, members_count) {
    this.sendDataToClients(conversation, MEMBER_JOINED_CONVERSATION, {conversation, member, members_count});
  }

  memberHasLeft(conversation, member, members_count) {
    this.sendDataToClients(conversation, MEMBER_LEFT_CONVERSATION, {conversation, member, members_count});
  }

  memberHasUnsubscribed(userId, conversationIds) {
    this.sendDataToUser(userId, MEMBER_UNSUBSCRIBED_CONVERSATION, { conversationIds });
  }

  sendDataToClients(conversation, type, data) {
    const payload = {
      data: data,
      room: DEFAULT_ROOM
    };

    if (conversation.type === CONVERSATION_TYPE.DIRECT_MESSAGE) {
      this.transport.sendDataToMembers(conversation.members, type, payload);
    } else {
      this.transport.sendDataToUsers(type, payload);
    }
  }

  sendDataToUser(user, type, data) {
   const payload = {
     data: data,
     room: DEFAULT_ROOM
   };

   this.transport.sendDataToUser(user, type, payload);
 }

  sendMessage(conversation, message) {
    this.sendDataToClients(conversation, 'message', message);
  }

  sendMessageToUser(user, message) {
    this.sendDataToUser(user, 'message', message);
  }

  topicUpdated(conversation) {
    this.sendDataToClients(conversation, CONVERSATION_TOPIC_UPDATED, conversation);
  }
}

module.exports = Messenger;
