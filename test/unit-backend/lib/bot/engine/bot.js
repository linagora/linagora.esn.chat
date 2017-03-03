'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const EventEmitter = require('events').EventEmitter;

describe('The bot', function() {
  let Bot, adapter, logger;
  let replySpy, sendSpy;

  beforeEach(function() {
    logger = this.moduleHelpers.logger;
    replySpy = sinon.spy();
    sendSpy = sinon.spy();
    Bot = require('../../../../../backend/lib/bot/engine/bot');
    adapter = new (class Adapter extends EventEmitter {
      constructor() {
        super();
        this.logger = logger;
      }
      /*eslint class-methods-use-this: "off"*/
      reply(source, message) {
        replySpy(source, message);
      }

      send(source, message) {
        sendSpy(source, message);
      }
    })();
  });

  describe('The listen function', function() {
    it('should register new listener', function() {
      const bot = new Bot(adapter);

      expect(bot.listeners.length).to.equal(0);

      bot.listen(function() {}, function() {});

      expect(bot.listeners.length).to.equal(1);
    });

    it('should throw error when matchHandler is undefined', function(done) {
      const bot = new Bot(adapter);

      expect(bot.listeners.length).to.equal(0);

      try {
        bot.listen(undefined, function() {});
      } catch (err) {
        expect(err.message).to.match(/matchHandler and responseHandler are required/);
        expect(bot.listeners.length).to.equal(0);

        return done();
      }

      done(new Error('Should throw error'));
    });

    it('should throw error when responseHandler is undefined', function(done) {
      const bot = new Bot(adapter);

      expect(bot.listeners.length).to.equal(0);

      try {
        bot.listen(function() {});
      } catch (err) {
        expect(err.message).to.match(/matchHandler and responseHandler are required/);
        expect(bot.listeners.length).to.equal(0);

        return done();
      }

      done(new Error('Should throw error'));
    });
  });

  describe('The start function', function() {
    it('should listen to adapter events', function() {
      const spy = sinon.spy(adapter, 'on');
      const bot = new Bot(adapter);

      bot.start();
      adapter.emit('message', {foo: 'bar'});

      expect(spy).to.have.been.calledOnce;
    });

    it('should not fail on next events when a responseHandler throws an error', function(done) {
      let calls = 0;
      const loggerSpy = sinon.spy(logger, 'warn');
      const error = new Error('Hey Bot, I failed');
      const bot = new Bot(adapter);
      const emitter = new EventEmitter();
      const message = {user: 1, room: 2, text: 'Hello Bot'};
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when('match2');
      });
      const match3 = sinon.spy(function() {
        return Q.when('match3');
      });

      const responseHandler1 = sinon.stub().throws(error);
      const responseHandler2 = sinon.spy();
      const responseHandler3 = sinon.spy(function() {
        emitter.emit('ping');
      });

      emitter.on('ping', function() {
        calls++;
        if (calls === 2) {
          expect(match1).to.have.been.calledTwice;
          expect(match2).to.have.been.calledTwice;
          expect(match3).to.have.been.calledTwice;
          expect(responseHandler1).to.have.been.calledTwice;
          expect(responseHandler2).to.have.been.calledTwice;
          expect(responseHandler3).to.have.been.calledTwice;
          expect(loggerSpy).to.have.been.calledTwice;
          expect(loggerSpy).to.have.been.calledWith('Error occured on responseMatcher', error);
          done();
        }
      });

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.listen(match3, responseHandler3);

      bot.start();
      adapter.emit('message', message);
      adapter.emit('message', message);
    });
  });

  describe('The processListeners function', function() {
    it('should call the matchHandler of all register listeners', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when('match2');
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        done();
      }, done);
    });

    it('should not fail when a responseHandler fails', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when('match2');
      });
      const match3 = sinon.spy(function() {
        return Q.when('match3');
      });

      const responseHandler1 = sinon.stub().throws();
      const responseHandler2 = sinon.spy();
      const responseHandler3 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.listen(match3, responseHandler3);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(match3).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.have.been.calledOnce;
        expect(responseHandler3).to.have.been.calledOnce;
        done();
      }, done);
    });

    it('should catch when matchHandler rejects but not reject', function(done) {
      const error = new Error('I failed to match');
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.reject(error);
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        done();
      }, done);
    });

    it('should call the handlers only on matchers which are mathing', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when(false);
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.not.have.been.called;
        done();
      }, done);
    });

    it('should call the handlers only on matchers which are not rejecting', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.reject(new Error('I failed!'));
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.not.have.been.called;
        done();
      }, done);
    });

    it('should not call the handlers when matcher returns empty array', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when([]);
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.not.have.been.called;
        done();
      }, done);
    });

    it('should call the handlers when matcher returns not empty array', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1 = sinon.spy(function() {
        return Q.when('match1');
      });
      const match2 = sinon.spy(function() {
        return Q.when([1]);
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.have.been.calledOnce;
        done();
      }, done);
    });

    it('should call the handlers with a response which contains the match result', function(done) {
      const bot = new Bot(adapter);
      const request = {
        message: {_id: 1}
      };
      const match1Result = 'match1';
      const match2Result = [1];
      const match1 = sinon.spy(function() {
        return Q.when(match1Result);
      });
      const match2 = sinon.spy(function() {
        return Q.when(match2Result);
      });
      const responseHandler1 = sinon.spy();
      const responseHandler2 = sinon.spy();

      bot.listen(match1, responseHandler1);
      bot.listen(match2, responseHandler2);
      bot.processListeners(request).then(function() {
        expect(match1).to.have.been.calledOnce;
        expect(match2).to.have.been.calledOnce;
        expect(responseHandler1).to.have.been.calledOnce;
        expect(responseHandler2).to.have.been.calledOnce;
        expect(responseHandler1.firstCall.args[0].request.match).to.deep.equal(match1Result);
        expect(responseHandler2.firstCall.args[0].request.match).to.deep.equal(match2Result);
        done();
      }, done);
    });
  });

  describe('The reply function', function() {
    it('should call the adapter reply', function() {
      const bot = new Bot(adapter);
      const source = 'foo';
      const message = {_id: 123};

      bot.reply(source, message);

      expect(replySpy).to.have.been.calledWith(source, message);
    });
  });

  describe('The send function', function() {
    it('should call the adapter send', function() {
      const bot = new Bot(adapter);
      const source = 'foo';
      const message = {_id: 123};

      bot.send(source, message);

      expect(sendSpy).to.have.been.calledWith(source, message);
    });
  });
});
