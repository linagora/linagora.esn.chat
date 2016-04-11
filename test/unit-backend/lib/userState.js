'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

describe('The linagora.esn.chat userState lib', function() {

  var deps;

  var dependencies = function(name) {
    return deps[name];
  };

  var redisGet, redisSet, redisGetResult;

  var connectionTopic, disconnectionTopic;

  function getUserState() {
    return require('../../../backend/lib/userState')(dependencies);
  }

  beforeEach(function() {
    redisGetResult = null;

    redisGet = sinon.spy(function(key, callback) {
      callback(null, redisGetResult);
    });

    redisSet = sinon.spy(function(key, value, callback) {
      callback(null, null);
    });

    connectionTopic = {
      subscribe: sinon.spy()
    };

    disconnectionTopic = {
      subscribe: sinon.spy()
    };

    deps = {
      db: {
        redis: {
          getClient: function(callback) {
            callback(null, {
              hgetall: redisGet,
              hmset: redisSet
            });
          }
        }
      },
      pubsub: {
        global: {
          topic: function(name) {
            if (name === 'user:connection') {
              return connectionTopic;
            } else if (name === 'user:disconnection') {
              return disconnectionTopic;
            }
          }
        }
      }
    };
  });

  describe('The get function', function() {
    it('should return disconnected if no state found in redis', function(done) {
      getUserState().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('disconnected');
        done();
      }).catch(done);
    });

    it('should return state saved in redis', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state'
      };

      getUserState().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('state');
        done();
      }).catch(done);
    });

    it('should return previous state if delay is not passed', function(done) {
      redisGetResult = {
        delay: 10000,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      getUserState().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('previousState');
        done();
      }).catch(done);
    });

    it('should not return previous state if delay is passed', function(done) {
      redisGetResult = {
        delay: 1,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      setTimeout(function() {
        getUserState().get('key').then(function(data) {
          expect(redisGet).to.have.been.calledWith('userState:key');
          expect(data).to.equal('state');
          done();
        }).catch(done);
      }, 2);
    });
  });

  describe('the restorePreviousState function', function() {
    it('should not set anything if nothing store in redis', function(done) {
      getUserState().restorePreviousState('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.not.been.calledWith('userState:key');
        done();
      }).catch(done);
    });

    it('should not set anything if no previous state store in redis', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state',
      };

      getUserState().restorePreviousState('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.not.been.calledWith('userState:key');
        done();
      }).catch(done);
    });

    it('should restore previous state if defined', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      getUserState().restorePreviousState('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          state: 'previousState',
          delay: 0,
        }));
        done();
      }).catch(done);
    });
  });

  describe('set state function', function() {
    it('should store previous state', function(done) {
      getUserState().set('key', 'state').then(function() {
        expect(redisGet).to.not.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('state', 'state'));
        done();
      }).catch(done);
    });

    it('if given delay it should store it', function(done) {
      getUserState().set('key', 'state', 42).then(function() {
        expect(redisGet).to.not.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('delay', 42));
        done();
      }).catch(done);
    });

    it('should store the moment where it has been store', function(done) {
      var before = Date.now();
      getUserState().set('key', 'state', 42).then(function() {
        expect(redisGet).to.not.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('since', sinon.match(function(time) {
          return time >= before && time <= Date.now();
        })));
        done();
      }).catch(done);
    });

    it('should save previous state when leaving a connected state for disconnected', function(done) {
      redisGetResult = {
        state: 'state',
        previousState: 'a previous state'
      };

      getUserState().set('key', 'disconnected', 42).then(function() {
        expect(redisGet).to.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          previousState: 'state',
          state: 'disconnected'
        }));
        done();
      }).catch(done);
    });

    it('should not erase previous state when set disconnected to a already disconnected user', function(done) {
      redisGetResult = {
        state: 'disconnected',
        previousState: 'previousState'
      };

      getUserState().set('key', 'disconnected', 42).then(function() {
        expect(redisGet).to.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          previousState: 'previousState',
          state: 'disconnected'
        }));
        done();
      }).catch(done);
    });
  });
});
