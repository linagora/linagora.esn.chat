'use strict';

const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The search messages listener', function() {

  let deps, logger;

  function dependencies(name) {
    return deps[name];
  }

  function getModule() {
    return require('../../../../../backend/lib/search/messages')(dependencies);
  }

  beforeEach(function() {
    logger = {
      error: console.log,
      info: console.log,
      debug: console.log
    };

    deps = {
      logger: logger
    };
  });

  describe('The indexMessage function', function() {
    it('should fail when search handler is not initialized', function(done) {
      mockery.registerMock('./listener', function() {});

      getModule().indexMessage(null, function(err) {
        expect(err.message).to.match(/chat.messages search is not initialized/);
        done();
      });
    });

    it('should fail when message is undefined', function(done) {
      mockery.registerMock('./listener', function() {
        return {
          register: function() {
            return {
              indexData: function() {}
            };
          }
        };
      });

      const module = getModule();

      module.registerListener();
      module.indexMessage(null, function(err) {
        expect(err.message).to.match(/message is required/);
        done();
      });
    });

    it('should index message', function() {
      const spy = sinon.spy();
      const message = {foo: 'bar'};

      mockery.registerMock('./listener', function() {
        return {
          register: function() {
            return {
              indexData: spy
            };
          }
        };
      });

      const module = getModule();

      module.registerListener();
      module.indexMessage(message);
      expect(spy).to.have.been.calledWith(message);
    });
  });

  describe('The removeMessageFromIndex function', function() {
    it('should fail when search handler is not initialized', function(done) {
      mockery.registerMock('./listener', function() {});

      getModule().removeMessageFromIndex(null, function(err) {
        expect(err.message).to.match(/chat.messages search is not initialized/);
        done();
      });
    });

    it('should fail when message is undefined', function(done) {
      mockery.registerMock('./listener', function() {
        return {
          register: function() {
            return {
              removeFromIndex: function() {}
            };
          }
        };
      });

      const module = getModule();

      module.registerListener();
      module.removeMessageFromIndex(null, function(err) {
        expect(err.message).to.match(/message is required/);
        done();
      });
    });

    it('should remove message', function() {
      const spy = sinon.spy();
      const message = {foo: 'bar'};

      mockery.registerMock('./listener', function() {
        return {
          register: function() {
            return {
              removeFromIndex: spy
            };
          }
        };
      });

      const module = getModule();

      module.registerListener();
      module.removeMessageFromIndex(message);
      expect(spy).to.have.been.calledWith(message);
    });
  });

  describe('The registerListener function', function() {
    it('should register the listener', function() {
      const spy = sinon.spy();

      mockery.registerMock('./listener', function() {
        return {
          register: spy
        };
      });

      getModule().registerListener();
      expect(spy).to.have.been.calledOnce;
    });
  });

});
