'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationMemberService service', function() {
  var chatConversationMemberService;
  var CHAT_MEMBER_STATUS;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _chatConversationMemberService_, _CHAT_MEMBER_STATUS_) {
    chatConversationMemberService = _chatConversationMemberService_;
    CHAT_MEMBER_STATUS = _CHAT_MEMBER_STATUS_;
  }));

  describe('The currentUserIsMemberOf function', function() {
    it('should return false when conversation is undefined', function() {
      expect(chatConversationMemberService.currentUserIsMemberOf()).to.be.false;
    });

    it('should return false when conversation.member_status is undefined', function() {
      expect(chatConversationMemberService.currentUserIsMemberOf({})).to.be.false;
    });

    it('should return false when conversation.member_status is not CHAT_MEMBER_STATUS.MEMBER', function() {
      expect(chatConversationMemberService.currentUserIsMemberOf({member_status: 'foo'})).to.be.false;
    });

    it('should return true when conversation.member_status is CHAT_MEMBER_STATUS.MEMBER', function() {
      expect(chatConversationMemberService.currentUserIsMemberOf({member_status: CHAT_MEMBER_STATUS.MEMBER})).to.be.true;
    });
  });
});
