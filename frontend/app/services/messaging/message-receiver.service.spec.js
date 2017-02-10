'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageReceiverService factory', function() {
  var user, domain, session, message;
  var $rootScope, $log;
  var chatMessageReceiverService;
  var CHAT_MESSAGE_TYPE;

  beforeEach(function() {
    user = {_id: 'userId'};
    domain = {_id: 'domainId'};
    session = {
      user: user,
      domain: domain
    };
    message = {};
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$log_, _$rootScope_, _chatMessageReceiverService_, _CHAT_MESSAGE_TYPE_) {
    $log = _$log_;
    $rootScope = _$rootScope_;
    chatMessageReceiverService = _chatMessageReceiverService_;
    CHAT_MESSAGE_TYPE = _CHAT_MESSAGE_TYPE_;
  }));

  describe('The onMessage function', function() {
    var logSpy;

    beforeEach(function() {
      sinon.spy($rootScope, '$broadcast');
      logSpy = sinon.spy($log, 'debug');
    });

    it('should skip when message is empty', function() {
      chatMessageReceiverService.onMessage();

      expect(logSpy).to.have.been.calledTwice;
      expect(logSpy.getCalls()[1].args[0]).to.equal('Empty message returned, skipping');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should skip when message does not have type', function() {
      chatMessageReceiverService.onMessage(message);

      expect(logSpy.getCalls()[1].args[0]).to.equal('Message does not have valid type, skipping');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should skip when it is a current user typing message', function() {
      message.creator = user._id;
      message.type = CHAT_MESSAGE_TYPE.USER_TYPING;
      chatMessageReceiverService.onMessage(message);

      expect(logSpy.getCalls()[1].args[0]).to.equal('Skipping own message');
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should broadcast the message', function() {
      message.type = 'MyType';
      chatMessageReceiverService.onMessage(message);

      expect($rootScope.$broadcast).to.have.been.calledWith('chat:message:' + message.type, message);
    });
  });
});
