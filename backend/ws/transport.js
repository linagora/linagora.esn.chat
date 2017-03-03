'use strict';

const EventEmitter = require('events').EventEmitter;

class Transport extends EventEmitter {
  constructor(chatNamespace, options) {
    super();
    this.chatNamespace = chatNamespace;
    this.helper = options.dependencies('wsserver').ioHelper;
    this.logger = options.dependencies('logger');
    this.listenToEvents();
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
          this.emit('message', message);
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
