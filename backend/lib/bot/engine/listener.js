'use strict';

class Listener {
  constructor(bot, matchHandler, handler) {
    this.bot = bot;
    this.matchHandler = matchHandler;
    this.handler = handler;
  }
}

module.exports = Listener;
