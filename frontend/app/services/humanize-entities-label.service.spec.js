'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The chatHumanizeEntitiesLabel service', function() {
  var chatHumanizeEntitiesLabel;

  beforeEach(angular.mock.module('linagora.esn.chat', function($provide) {
    $provide.value('searchProviders', {
      add: sinon.spy()
    });
    $provide.value('chatSearchMessagesProviderService', {});
  }));

  beforeEach(angular.mock.inject(function(_chatHumanizeEntitiesLabel_) {
    chatHumanizeEntitiesLabel = _chatHumanizeEntitiesLabel_;
  }));

  describe('addHumanRepresentation method', function() {
    it('should return label if not already here', function() {
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '1')).to.be.equals('alice');
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('bob', '1')).to.be.equals('bob');
    });

    it('should return label if already here but with the same value', function() {
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '1')).to.be.equals('alice');
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '1')).to.be.equals('alice');
    });

    it('should return label plus a num if already exit with a different value', function() {
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '1')).to.be.equals('alice');
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '2')).to.be.equals('alice1');
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '3')).to.be.equals('alice2');
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '2')).to.be.equals('alice1');
    });
  });

  describe('reset method', function() {
    it('should erase previous recorded label', function() {
      chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '1');
      chatHumanizeEntitiesLabel.reset();
      expect(chatHumanizeEntitiesLabel.addHumanRepresentation('alice', '2')).to.be.equals('alice');
    });
  });

  describe('replaceHumanPresentationByRealData method', function() {
    it('should replace all recorded label by there real value', function() {
      chatHumanizeEntitiesLabel.addHumanRepresentation('@alice', '@1');
      chatHumanizeEntitiesLabel.addHumanRepresentation('@bob', '@2');
      chatHumanizeEntitiesLabel.addHumanRepresentation('@alice', '@3');
      expect(chatHumanizeEntitiesLabel.replaceHumanPresentationByRealData('Hi @alice, @bob and @alice1')).to.equals('Hi @1, @2 and @3');
    });
  });
});
