'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageReceiverService factory', function() {
  var user, domain, session, message;
  var $rootScope, $log;
  var chatMessageReceiverService, chatMessengerService;
  var CHAT_MESSAGE_TYPE, CHAT_MESSAGE_PREFIX, CHAT_WEBSOCKET_EVENTS;

  beforeEach(function() {
    user = {_id: 'userId'};
    domain = {_id: 'domainId'};
    session = {
      user: user,
      domain: domain
    };
    message = {};
    chatMessengerService = {
      addEventListener: sinon.spy()
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatMessengerService', chatMessengerService);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$log_, _$rootScope_, _chatMessageReceiverService_, _CHAT_MESSAGE_TYPE_, _CHAT_MESSAGE_PREFIX_, _CHAT_WEBSOCKET_EVENTS_) {
    $log = _$log_;
    $rootScope = _$rootScope_;
    chatMessageReceiverService = _chatMessageReceiverService_;
    CHAT_MESSAGE_TYPE = _CHAT_MESSAGE_TYPE_;
    CHAT_MESSAGE_PREFIX = _CHAT_MESSAGE_PREFIX_;
    CHAT_WEBSOCKET_EVENTS = _CHAT_WEBSOCKET_EVENTS_;
  }));

  describe('The addEventListener function', function() {
    it('should listener to the chatMessengerService service', function() {
      chatMessageReceiverService.addEventListener();

      expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_WEBSOCKET_EVENTS.MESSAGE, chatMessageReceiverService.onMessage);
    });
  });

  describe('The onMessage function', function() {
    var logSpy;

    beforeEach(function() {
      sinon.spy($rootScope, '$broadcast');
      logSpy = sinon.spy($log, 'debug');
    });

    it('should skip when message is empty', function() {
      chatMessageReceiverService.onMessage();

      expect(logSpy).to.have.been.calledTwice;
      expect(logSpy.secondCall.args[0]).to.equal('Empty message returned, skipping');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should skip when message does not have type', function() {
      chatMessageReceiverService.onMessage(message);

      expect(logSpy.secondCall.args[0]).to.equal('Message does not have valid type, skipping');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should skip when it is a current user typing message', function() {
      message.creator = user._id;
      message.type = CHAT_MESSAGE_TYPE.USER_TYPING;
      chatMessageReceiverService.onMessage(message);

      expect(logSpy.secondCall.args[0]).to.equal('Skipping own message');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should broadcast the message', function() {
      message.type = 'MyType';
      chatMessageReceiverService.onMessage(message);

      expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_MESSAGE_PREFIX + message.type, message);
    });
  });
});
