'use strict';

const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The search conversations listener', function() {

  let deps, logger;

  function dependencies(name) {
    return deps[name];
  }

  function getModule() {
    return require('../../../../../backend/lib/search/conversations')(dependencies);
  }

  beforeEach(function() {
    logger = {
      /*eslint no-console: ["error", { allow: ["log"] }] */
      error: console.log,
      info: console.log,
      debug: console.log
    };

    deps = {
      logger: logger
    };

    mockery.registerMock('./reindex', () => {});
  });

  describe('The indexConversation function', function() {
    it('should fail when search handler is not initialized', function(done) {
      mockery.registerMock('./listener', function() {});

      getModule().indexConversation(null, function(err) {
        expect(err.message).to.match(/chat.conversations search is not initialized/);
        done();
      });
    });

    it('should fail when conversation is undefined', function(done) {
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
      module.indexConversation(null, function(err) {
        expect(err.message).to.match(/conversation is required/);
        done();
      });
    });

    it('should index conversation', function() {
      const spy = sinon.spy();
      const conversation = {foo: 'bar'};

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
      module.indexConversation(conversation);
      expect(spy).to.have.been.calledWith(conversation);
    });
  });

  describe('The removeConversationFromIndex function', function() {
    it('should fail when search handler is not initialized', function(done) {
      mockery.registerMock('./listener', function() {});

      getModule().removeConversationFromIndex(null, function(err) {
        expect(err.message).to.match(/chat.conversations search is not initialized/);
        done();
      });
    });

    it('should fail when conversation is undefined', function(done) {
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
      module.removeConversationFromIndex(null, function(err) {
        expect(err.message).to.match(/conversation is required/);
        done();
      });
    });

    it('should remove conversation', function() {
      const spy = sinon.spy();
      const conversation = {foo: 'bar'};

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
      module.removeConversationFromIndex(conversation);
      expect(spy).to.have.been.calledWith(conversation);
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
