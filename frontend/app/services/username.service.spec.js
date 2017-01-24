'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatUsername service', function() {
  var chatUsername, CHAT_MENTION_CHAR;
  var username = 'chuck';

  beforeEach(angular.mock.module('linagora.esn.chat'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('userUtils', {
        displayNameOf: function() { return username; }
      });
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_chatUsername_, _CHAT_MENTION_CHAR_) {
    chatUsername = _chatUsername_;
    CHAT_MENTION_CHAR = _CHAT_MENTION_CHAR_;
  }));

  describe('The generate function', function() {
    it('should return the userUtils.displayNameOf value', function() {
      expect(chatUsername.generate({})).to.equal(username);
    });
  });

  describe('The generateMention function', function() {
    it('should return a value starting with @', function() {
      expect(chatUsername.generateMention({})[0]).to.equal(CHAT_MENTION_CHAR);
    });
  });
});
