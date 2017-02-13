'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageService factory', function() {
  var $q, $rootScope, chatMessengerService, chatMessageService, fileUploadServiceMock, backgroundProcessorServiceMock;
  var DEFAULT_FILE_TYPE;

  beforeEach(function() {
    DEFAULT_FILE_TYPE = 'txt';
    fileUploadServiceMock = {};
    backgroundProcessorServiceMock = {};
    chatMessengerService = {
      sendMessage: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('backgroundProcessorService', backgroundProcessorServiceMock);
      $provide.value('chatMessengerService', chatMessengerService);
      $provide.value('fileUploadService', fileUploadServiceMock);
      $provide.value('DEFAULT_FILE_TYPE', DEFAULT_FILE_TYPE);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _chatMessageService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatMessageService = _chatMessageService_;

    chatMessengerService.sendMessage = sinon.spy(function() {
      return $q.when();
    });
  }));

  describe('The isSystemMessage function', function() {
    it('should return true when message subtype is a `conversation_join`', function() {
      var message = {subtype: 'conversation_join'};

      expect(chatMessageService.isSystemMessage(message)).to.be.true;
    });

    it('should return true when message subtype is a `topic_update`', function() {
      var message = {subtype: 'topic_update'};

      expect(chatMessageService.isSystemMessage(message)).to.be.true;
    });

    it('should return false when message subtype is not a system message subtype', function() {
      var message = {};

      expect(chatMessageService.isSystemMessage(message)).to.be.false;
    });
  });

  describe('sendMessage function', function() {
    it('should send a message with text as type', function() {
      var promiseCallback = sinon.spy();

      chatMessageService.sendMessage({data: 'data'}).then(promiseCallback);
      $rootScope.$digest();

      expect(chatMessengerService.sendMessage).to.have.been.calledWith({data: 'data', type: 'text'});
      expect(promiseCallback).to.have.been.calledOnce;
    });
  });

  describe('sendUserTyping function ', function() {
    it('should send a message with user_typing as type', function() {
      var promiseCallback = sinon.spy();

      chatMessageService.sendUserTyping({data: 'data'}).then(promiseCallback);
      $rootScope.$digest();

      expect(chatMessengerService.sendMessage).to.have.been.calledWith({data: 'data', type: 'user_typing'});
      expect(promiseCallback).to.have.been.calledOnce;
    });
  });
});
