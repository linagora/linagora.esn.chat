'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageReceiverService factory', function() {
  var message, $log;
  var chatMessageReceiverService, chatMessengerService, chatConversationActionsService;
  var CHAT_MESSAGE_PREFIX, CHAT_WEBSOCKET_EVENTS;

  beforeEach(function() {
    message = {};
    chatMessengerService = {
      addEventListener: sinon.spy()
    };
    chatConversationActionsService = {
      onMessage: sinon.spy()
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
      $provide.value('chatConversationActionsService', chatConversationActionsService);
    });
  });

  beforeEach(angular.mock.inject(function(_$log_, _chatMessageReceiverService_, _CHAT_MESSAGE_PREFIX_, _CHAT_WEBSOCKET_EVENTS_) {
    $log = _$log_;
    chatMessageReceiverService = _chatMessageReceiverService_;
    CHAT_MESSAGE_PREFIX = _CHAT_MESSAGE_PREFIX_;
    CHAT_WEBSOCKET_EVENTS = _CHAT_WEBSOCKET_EVENTS_;
  }));

  describe('The addEventListener function', function() {
    it('should add listener to the chatMessengerService service', function() {
      chatMessageReceiverService.addEventListener();

      expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_WEBSOCKET_EVENTS.MESSAGE, chatMessageReceiverService.onMessage);
    });
  });

  describe('The onMessage function', function() {
    var logSpy;

    beforeEach(function() {
      logSpy = sinon.spy($log, 'debug');
      chatConversationActionsService.onMessage = sinon.spy();
    });

    it('should skip when message is empty', function() {
      chatMessageReceiverService.onMessage();

      expect(logSpy).to.have.been.calledTwice;
      expect(logSpy.secondCall.args[0]).to.equal('Empty message returned, skipping');
      expect(chatConversationActionsService.onMessage).to.not.have.been.called;
    });

    it('should skip when message does not have type', function() {
      chatMessageReceiverService.onMessage(message);

      expect(logSpy.secondCall.args[0]).to.equal('Message does not have valid type, skipping');
      expect(chatConversationActionsService.onMessage).to.not.have.been.called;
    });

    it('should send message to chatConversationActionsService.onMessage', function() {
      message.type = 'MyType';
      chatMessageReceiverService.onMessage(message);

      expect(chatConversationActionsService.onMessage).to.have.been.calledWith(CHAT_MESSAGE_PREFIX + message.type, message);
    });
  });
});
