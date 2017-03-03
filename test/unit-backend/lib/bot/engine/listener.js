'use strict';

const expect = require('chai').expect;

describe('The bot Listener', function() {
  it('should instanciate correctly', function() {
    const Listener = require('../../../../../backend/lib/bot/engine/listener');
    const bot = {name: 'ChatBot'};
    const matchHandler = function() {};
    const handler = function() {};

    const listener = new Listener(bot, matchHandler, handler);

    expect(listener.bot).to.equal(bot);
    expect(listener.matchHandler).to.equal(matchHandler);
    expect(listener.handler).to.equal(handler);
  });
});
