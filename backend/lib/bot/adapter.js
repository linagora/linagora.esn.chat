'use strict';

const EventEmitter = require('events').EventEmitter;
const CONSTANTS = require('../constants');
const MESSAGE_TYPE = CONSTANTS.MESSAGE_TYPE;

class ChatAdapter extends EventEmitter {
  constructor(dependencies, lib, messenger) {
    super();
    this.dependencies = dependencies;
    this.lib = lib;
    this.messenger = messenger;
    this.logger = dependencies('logger');
    this.messenger.on('message', this.onMessage.bind(this));
  }

  onMessage(message) {
    if (message.type === MESSAGE_TYPE.TEXT) {
      message.user = message.creator._id || message.creator;
      message.room = message.channel._id || message.channel;
      this.emit('message', message);
    }
  }

  reply(context, message) {
    message.type = MESSAGE_TYPE.BOT;
    message.channel = context.room;
    message.creator = context.user;
    message.timestamps = { creation: Date.now() };
    this.messenger.sendMessageToUser(context.user, message);
  }

  send(context, message) {
    message.type = MESSAGE_TYPE.BOT;
    this.lib.conversation.getById(context.room, (err, conversation) => {
      if (err) {
        return this.logger.warn(`Error while getting conversation ${context.room}`, err);
      }

      if (!conversation) {
        return this.logger.warn(`Can not find conversation ${context.room}`);
      }

      this.messenger.sendMessage(conversation, message);
    });
  }
}

module.exports = ChatAdapter;
