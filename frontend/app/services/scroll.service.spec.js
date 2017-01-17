'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatScrollService', function() {

  var elementScrollService,
      elementScrollServiceMock,
      chatScrollService,
      chatLocalStateService,
      chatLocalStateServiceMock,
      conversationMock,
      searchProviders;

  conversationMock = {canScrollDown: false};

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    searchProviders = {
      add: sinon.spy()
    };

    elementScrollServiceMock = {
      autoScrollDown: sinon.spy()
    };

    chatLocalStateServiceMock = {
      findConversation: function() {
        return conversationMock;
      },
      isActiveRoom: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('elementScrollService', elementScrollServiceMock);
      $provide.value('chatLocalStateService', chatLocalStateServiceMock);
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_chatScrollService_, _elementScrollService_, _chatLocalStateService_) {
    chatScrollService = _chatScrollService_;
    elementScrollService = _elementScrollService_;
    chatLocalStateService = _chatLocalStateService_;
  }));

  describe('The scrollDown function', function() {

    it('should call elementScrollService.autoScrollDown service', function() {
      chatScrollService.scrollDown();
      expect(elementScrollService.autoScrollDown).to.have.been.called;
    });
  });

  describe('when the setCanScrollDown function called with true', function() {

    it('should set the canScrollDown flag to true', function() {
      chatLocalStateService.findConversation = sinon.stub().returns(conversationMock);
      chatScrollService.setCanScrollDown('1', true);
      expect(conversationMock.canScrollDown).to.equal(true);
    });

    it('The canScrollDown function return true when isActiveRoom return true', function() {
      chatLocalStateService.findConversation = sinon.stub().returns(conversationMock);
      chatLocalStateService.isActiveRoom = sinon.stub().returns(true);
      expect(chatScrollService.canScrollDown()).to.equal(true);
    });

    it('The canScrollDown function return false when isActiveRoom return false', function() {
      chatLocalStateService.findConversation = sinon.stub().returns(conversationMock);
      chatLocalStateService.isActiveRoom = sinon.stub().returns(false);
      expect(chatScrollService.canScrollDown()).to.equal(false);
    });

    it('The canScrollDown function do nothing when findConversation does not return result', function() {
      chatLocalStateService.findConversation = sinon.stub().returns();
      expect(chatLocalStateService.isActiveRoom).to.not.have.been.called;
    });
  });

  describe('when the setCanScrollDown function called with false', function() {

    it('should set the canScrollDown flag to false', function() {

      chatLocalStateService.findConversation = sinon.stub().returns(conversationMock);
      chatScrollService.setCanScrollDown('1', false);

      expect(conversationMock.canScrollDown).to.equal(false);
    });

    describe('The canScrollDown function', function() {

      it('should return false when canScrollDown return false', function() {
        chatLocalStateService.findConversation = sinon.stub().returns(conversationMock);
        chatLocalStateService.isActiveRoom = sinon.stub().returns(true);

        expect(chatScrollService.canScrollDown()).to.equal(false);
      });

    });
  });
});
