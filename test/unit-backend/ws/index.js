'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const mockery = require('mockery');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The Websocket module', function() {

  var logger, chatNamespace, lib;

  function requireModule() {
    return require('../../../backend/ws');
  }

  beforeEach(function() {
    const self = this;

    logger = { info: sinon.spy(), warn: sinon.spy() };

    chatNamespace = {
      on: sinon.spy(),
      emit: sinon.spy()
    };

    lib = {};

    _.forEach({
      logger: logger,
      wsserver: {
        io: {
          of: function(name) {
            if (name === CONSTANTS.WEBSOCKET.NAMESPACE) {
              return chatNamespace;
            }
          }
        }
      }
    }, function(value, key) {
      self.moduleHelpers.addDep(key, value);
    });
  });

  describe('The init function', function() {
    let messengerSpy, transportSpy, bindSpy;

    beforeEach(function() {
      messengerSpy = sinon.spy();
      transportSpy = sinon.spy();
      bindSpy = sinon.spy();

      const messenger = class {
        constructor(namespace, options) {
          messengerSpy(namespace, options);
        }
      };

      const transport = class {
        constructor(namespace, options) {
          transportSpy(namespace, options);
        }
      };

      mockery.registerMock('./adapter', function() {
        return {
          bindEvents: bindSpy
        };
      });
      mockery.registerMock('./messenger', messenger);
      mockery.registerMock('./transport', transport);
    });

    it('should bind events to the messenger', function() {
      requireModule().init(this.moduleHelpers.dependencies, lib);

      expect(transportSpy).to.have.been.calledOnce;
      expect(messengerSpy).to.have.been.calledOnce;
      expect(bindSpy).to.have.been.calledOnce;
    });

    it('should not allow to be called more than one time', function() {
      const module = requireModule();

      module.init(this.moduleHelpers.dependencies, lib);
      module.init(this.moduleHelpers.dependencies, lib);

      expect(transportSpy).to.have.been.calledOnce;
      expect(messengerSpy).to.have.been.calledOnce;
      expect(bindSpy).to.have.been.calledOnce;
      expect(logger.warn).to.have.been.calledWith('The chat websocket service is already initialized');
    });

    it('should return messenger and transport', function() {
      const module = requireModule();
      const result = module.init(this.moduleHelpers.dependencies, lib);

      expect(result.messenger).to.exist;
      expect(result.transport).to.exist;
    });
  });
});
