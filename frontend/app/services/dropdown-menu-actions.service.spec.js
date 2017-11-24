'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatDropdownMenuActionsService', function() {
  var chatConversationsStoreServiceMock, chatDropdownMenuActionsService, sessionMock, activeRoom, chatConversationMemberService;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    activeRoom = {
      _id: 'roomId',
      creator: 'aCreator'
    };

    sessionMock = {
      _id: 'id',
      user: {
        _id: 'userId'
      },
      userIsDomainAdministrator: function() {
        return false;
      }
    };

    chatConversationsStoreServiceMock = {
      activeRoom: activeRoom
    };

    chatConversationMemberService = {
      currentUserIsMemberOf: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', sessionMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('chatConversationMemberService', chatConversationMemberService);
    });
  });

  beforeEach(inject(function(_chatDropdownMenuActionsService_) {
    chatDropdownMenuActionsService = _chatDropdownMenuActionsService_;
  }));

  describe('the canInjectLeaveAction method', function() {

    it('should return true if the user is a member and not the channel creator', function() {
      chatConversationMemberService.currentUserIsMemberOf = sinon.stub().returns(true);

      expect(chatDropdownMenuActionsService.canInjectLeaveAction()).to.be.true;
      expect(chatConversationMemberService.currentUserIsMemberOf).to.be.calledWith(activeRoom);
    });

    it('should return false if the user is the channel creator', function() {
      activeRoom.creator = sessionMock.user._id;

      expect(chatDropdownMenuActionsService.canInjectLeaveAction()).to.be.false;
    });

    it('should return false if the user is not member', function() {
      chatConversationMemberService.currentUserIsMemberOf = sinon.stub().returns(false);

      expect(chatDropdownMenuActionsService.canInjectLeaveAction()).to.be.false;
      expect(chatConversationMemberService.currentUserIsMemberOf).to.be.calledWith(activeRoom);
    });

  });

  describe('the canInjectArchiveAction method', function() {

    it('should return true if the user is an admin', function() {
      sessionMock.userIsDomainAdministrator = sinon.stub().returns(true);

      expect(chatDropdownMenuActionsService.canInjectArchiveAction()).to.be.true;
      expect(sessionMock.userIsDomainAdministrator).to.be.called;
    });

    it('should return true if the user is the channel creator', function() {
      activeRoom.creator = sessionMock.user._id;

      expect(chatDropdownMenuActionsService.canInjectArchiveAction()).to.be.true;
    });

    it('should return false if the user is neather a creator or admin', function() {
      sessionMock.userIsDomainAdministrator = sinon.stub().returns(false);

      expect(chatDropdownMenuActionsService.canInjectArchiveAction()).to.be.false;
      expect(sessionMock.userIsDomainAdministrator).to.be.called;
    });

    it('should return false if the active room is the general channel', function() {
      delete activeRoom.creator;
      sessionMock.userIsDomainAdministrator = sinon.stub().returns(true);

      expect(chatDropdownMenuActionsService.canInjectArchiveAction()).to.be.false;
    });

  });

  describe('the canInjectAddMembersAction method', function() {

    it('should call `chatConversationMemberService.currentUserIsMemberOf` with activeRoom', function() {
      chatDropdownMenuActionsService.canInjectAddMembersAction();

      expect(chatConversationMemberService.currentUserIsMemberOf).to.be.calledWith(activeRoom);
    });

  });
});
