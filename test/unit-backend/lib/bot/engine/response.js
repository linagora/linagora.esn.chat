'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The bot Response', function() {
  let Response, bot, request, message;

  beforeEach(function() {
    bot = {name: 'ChatBot', send: sinon.spy(), reply: sinon.spy()};
    message = {_id: 2, text: 'Hello bot!'};
    request = {_id: 1, foo: 'bar'};
    Response = require('../../../../../backend/lib/bot/engine/response');
  });

  it('should instanciate correctly', function() {
    const response = new Response(bot, request);

    expect(response.bot).to.equal(bot);
    expect(response.request).to.equal(request);
  });

  describe('The send function', function() {
    it('should call bot.send with right parameters', function() {
      const response = new Response(bot, request);

      response.send(message);

      expect(bot.send).to.have.been.calledWith(request, message);
    });
  });

  describe('The reply function', function() {
    it('should call bot.reply with right parameters', function() {
      const response = new Response(bot, request);

      response.reply(message);

      expect(bot.reply).to.have.been.calledWith(request, message);
    });
  });
});
