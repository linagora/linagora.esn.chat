'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatDropdownMenuActionsService', function() {
  var chatConversationsStoreServiceMock, chatDropdownMenuActionsService, sessionMock, activeRoom;

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
      }
    };

    chatConversationsStoreServiceMock = {
      activeRoom: activeRoom
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', sessionMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
    });
  });

  beforeEach(inject(function(_chatDropdownMenuActionsService_) {
    chatDropdownMenuActionsService = _chatDropdownMenuActionsService_;
  }));

  describe('the canInjectLeaveAction method', function() {

    it('should return true if the user is not the channel creator', function() {

      expect(chatDropdownMenuActionsService.canInjectLeaveAction()).to.be.true;
    });

    it('should return false if the user is the channel creator', function() {

      activeRoom.creator = sessionMock.user._id;

      expect(chatDropdownMenuActionsService.canInjectLeaveAction()).to.be.false;
    });

  });
});
