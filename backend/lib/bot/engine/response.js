'use strict';

class Response {
  constructor(bot, request) {
    this.bot = bot;
    this.request = request;
    this.user = request.user;
    this.room = request.room;
  }

  // send back a message to the original room of this.message
  send(message) {
    this.bot.send(this.request, message);
  }

  // reply to this.message.creator
  reply(message) {
    this.bot.reply(this.request, message);
  }
}

module.exports = Response;
