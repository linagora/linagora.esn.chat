'use strict';

class Request {
  constructor(message) {
    this.message = Object.assign({}, message);
    this.user = message.user;
    this.room = message.room;
  }
}

module.exports = Request;
