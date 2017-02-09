'use strict';

const EventEmitter = require('events').EventEmitter;

const CONSTANTS = require('../lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;

class Messenger extends EventEmitter {

  constructor(transport, options) {
    super();
    this.lib = options.lib;
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

  newMemberAdded(conversation) {
    this.sendDataToClients(conversation, MEMBER_ADDED_IN_CONVERSATION, conversation);
  }

  sendDataToClients(conversation, type, data) {
    if (conversation.type === CONVERSATION_TYPE.CONFIDENTIAL) {
      this.transport.sendDataToMembers(conversation.members, type, data);
    } else {
      this.transport.sendDataToUsers(type, data);
    }
  }

  sendMessage(room, message) {
    this.lib.conversation.getById(message.channel, (err, conversation) => {
      if (err) {
        return this.logger.error('Error while getting conversation to send message', err);
      }

      if (!conversation) {
        return this.logger.warn('Can not find conversation to send message');
      }

      this.sendDataToClients(conversation, 'message', {room, data: message});
    });
  }

  topicUpdated(conversation) {
    this.sendDataToClients(conversation, CONVERSATION_TOPIC_UPDATED, conversation);
  }
}

module.exports = Messenger;
