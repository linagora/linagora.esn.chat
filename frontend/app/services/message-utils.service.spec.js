'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageUtils factory', function() {
  var user, userId, session, chatMessageUtilsService, message;
  var CHAT_MESSAGE_TYPE;

  beforeEach(function() {
    userId = '1';
    message = {};
    user = {_id: userId};
    session = {
      user: user
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchProviderService', {});
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_chatMessageUtilsService_, _CHAT_MESSAGE_TYPE_) {
    chatMessageUtilsService = _chatMessageUtilsService_;
    CHAT_MESSAGE_TYPE = _CHAT_MESSAGE_TYPE_;
  }));

  describe('The isMeTyping function', function() {
    it('should return false when message.creator is undefined', function() {
      expect(chatMessageUtilsService.isMeTyping(message)).to.not.be.ok;
    });

    it('should return false when message.creator is not session one', function() {
      message.creator = '!' + userId;
      expect(chatMessageUtilsService.isMeTyping(message)).to.be.false;
    });

    it('should return false when type is not user_typing', function() {
      message.creator = userId;
      message.type = '!' + CHAT_MESSAGE_TYPE.USER_TYPING;
      expect(chatMessageUtilsService.isMeTyping(message)).to.be.false;
    });

    it('should return false current user is not session one and type is user_typing', function() {
      message.creator = '!' + userId;
      message.type = CHAT_MESSAGE_TYPE.USER_TYPING;
      expect(chatMessageUtilsService.isMeTyping(message)).to.be.false;
    });

    it('should return true when message creator is session one and message type is user_typing', function() {
      message.creator = userId;
      message.type = CHAT_MESSAGE_TYPE.USER_TYPING;
      expect(chatMessageUtilsService.isMeTyping(message)).to.be.true;
    });
  });
});
