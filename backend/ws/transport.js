'use strict';

const EventEmitter = require('events').EventEmitter;
const Q = require('q');

class Transport extends EventEmitter {
  constructor(chatNamespace, options) {
    super();
    this.chatNamespace = chatNamespace;
    this.helper = options.ioHelper;
    this.logger = options.logger;
    this.membersLib = options.membersLib;
    this.userModule = options.userModule;
    this.conversation = options.conversation;
    this.listenToEvents();
  }

  getUser(userId) {
    return this.userModule.get(userId);
  }

  getConversationById(conversationId) {
    return Q.denodeify(this.conversation.getById)(conversationId);
  }

  isMember(conversation, user) {
    return this.membersLib.isMember(conversation, user);
  }

  listenToEvents() {
    this.chatNamespace.on('connection', socket => {
      const userId = this.helper.getUserId(socket);

      socket.on('subscribe', room => {
        this.logger.info(`Joining chat channel ${room}`);
        socket.emit('hello');
        socket.join(room);

        socket.on('unsubscribe', room => {
          this.logger.info(`Leaving chat channel ${room}`);
          socket.leave(room);
        });

        socket.on('message', message => {
          message.date = Date.now();
          message.room = room;
          message.creator = userId;

          if (message.type === 'text') {
            Q.all([this.getConversationById(message.channel), this.getUser(message.creator)])
              .spread((conversation, user) => {
                this.isMember(conversation, user).then(isMember => {
                  if (isMember) {
                    this.emit('message', message);
                  } else {
                    this.logger.info(`${user._id} is not a member of chat channel ${message.channel}`);
                  }
                });
              });
          } else {
            this.emit('message', message);
          }
        });
      });
    });
  }

  sendDataToMembers(members = [], type, data) {
    members.forEach(member => {
      const sockets = this.helper.getUserSocketsFromNamespace(member.member.id, this.chatNamespace.sockets) || [];

      sockets.forEach(socket => socket.emit(type, data));
    });
  }

  sendDataToUser(user, type, data) {
    const sockets = this.helper.getUserSocketsFromNamespace(user._id || user, this.chatNamespace.sockets) || [];

    sockets.forEach(socket => socket.emit(type, data));
  }

  sendDataToUsers(type, data) {
    this.chatNamespace.emit(type, data);
  }
}

module.exports = Transport;
