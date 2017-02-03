'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatScrollService', function() {

  var elementScrollService,
      elementScrollServiceMock,
      chatScrollService,
      chatConversationsStoreService,
      conversation,
      searchProviders;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {
    conversation = {_id: 1, canScrollDown: false};

    searchProviders = {
      add: sinon.spy()
    };

    elementScrollServiceMock = {
      autoScrollDown: sinon.spy()
    };

    chatConversationsStoreService = {
      findConversation: sinon.spy(function() {
        return conversation;
      }),
      isActiveRoom: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('elementScrollService', elementScrollServiceMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_chatScrollService_, _elementScrollService_) {
    chatScrollService = _chatScrollService_;
    elementScrollService = _elementScrollService_;
  }));

  describe('The scrollDown function', function() {

    it('should call elementScrollService.autoScrollDown service', function() {
      chatScrollService.scrollDown();

      expect(elementScrollService.autoScrollDown).to.have.been.called;
    });
  });

  describe('The setCanScrollDown function', function() {
    it('should set the canScrollDown flag in the conversation with the given value', function() {
      var value = 'My value';

      chatScrollService.setCanScrollDown(conversation._id, value);

      expect(conversation.canScrollDown).to.equal(value);
    });
  });

  describe('The canScrollDown function', function() {

    it('should return true when conversation.canScrollDown and conversation is the active one', function() {
      conversation.canScrollDown = true;

      chatConversationsStoreService.isActiveRoom = sinon.spy(function() {
        return true;
      });

      expect(chatScrollService.canScrollDown(conversation._id)).to.be.true;
      expect(chatConversationsStoreService.isActiveRoom).to.have.been.calledWith(conversation._id);
    });

    it('should return false when conversation.canScrollDown is false', function() {
      conversation.canScrollDown = false;

      chatConversationsStoreService.isActiveRoom = sinon.spy(function() {
        return true;
      });

      expect(chatScrollService.canScrollDown(conversation._id)).to.be.false;
      expect(chatConversationsStoreService.isActiveRoom).to.not.have.been.called;
    });

    it('should return false when conversation.canScrollDown is false and conversation is not the active one', function() {
      conversation.canScrollDown = false;

      chatConversationsStoreService.isActiveRoom = sinon.spy(function() {
        return false;
      });

      expect(chatScrollService.canScrollDown(conversation._id)).to.be.false;
      expect(chatConversationsStoreService.isActiveRoom).to.not.have.been.called;
    });

    it('should return false when conversation.canScrollDown is true and conversation is not the active one', function() {
      conversation.canScrollDown = true;

      chatConversationsStoreService.isActiveRoom = sinon.spy(function() {
        return false;
      });

      expect(chatScrollService.canScrollDown(conversation._id)).to.be.false;
      expect(chatConversationsStoreService.isActiveRoom).to.have.been.calledWith(conversation._id);
    });
  });
});
