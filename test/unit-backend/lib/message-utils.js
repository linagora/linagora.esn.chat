'use strict';

const expect = require('chai').expect;

describe('The message-utils module', function() {

  let messageUtils;

  beforeEach(function() {
    messageUtils = require('../../../backend/lib/message-utils');
  });

  describe('The isSystemMessage function', function() {
    it('should return false when message is undefined', function() {
      expect(messageUtils.isSystemMessage()).to.be.false;
    });

    it('should return false when message.subtype is undefined', function() {
      expect(messageUtils.isSystemMessage({})).to.be.false;
    });

    it('should return false when message.subtype is not a system subtype value', function() {
      expect(messageUtils.isSystemMessage({subtype: 'not a system message'})).to.be.false;
    });

    it('should return true when message.subtype is a system subtype value', function() {
      messageUtils.getSystemMessageSubtypes().forEach(subtype => {
        expect(messageUtils.isSystemMessage({subtype})).to.be.true;
      });
    });
  });
});
