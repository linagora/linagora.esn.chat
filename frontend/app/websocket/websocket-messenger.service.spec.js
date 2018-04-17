'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatWebsocketMessengerService factory', function() {
  var user, domain, session;
  var chatWebsocketMessengerService, ChatWebsocketTransportService;
  var instanceSpy;
  var CHAT_WEBSOCKET_ROOM;

  beforeEach(function() {
    instanceSpy = sinon.spy();
    chatWebsocketMessengerService = {};
    ChatWebsocketTransportService = function(options) {
      instanceSpy(options);
    };
    user = {_id: '123'};
    domain = {_id: '456'};
    session = {user: user, domain: domain};
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatSearchProviderService', {});
      $provide.value('ChatWebsocketTransportService', ChatWebsocketTransportService);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_chatWebsocketMessengerService_, _CHAT_WEBSOCKET_ROOM_) {
    chatWebsocketMessengerService = _chatWebsocketMessengerService_;
    CHAT_WEBSOCKET_ROOM = _CHAT_WEBSOCKET_ROOM_;
  }));

  describe('The get function', function() {
    it('should returns a chatWebsocketTransportInstance instance', function() {
      expect(chatWebsocketMessengerService.get()).to.be.an.instanceof(ChatWebsocketTransportService);
      expect(instanceSpy).to.have.been.calledWith({room: CHAT_WEBSOCKET_ROOM.DEFAULT, user: user._id});
    });

    it('should always return the same chatWebsocketTransportInstance instance', function() {
      var instance1 = chatWebsocketMessengerService.get();
      var instance2 = chatWebsocketMessengerService.get();

      expect(instanceSpy).to.have.been.calledOnce;
      expect(instance1).to.equal(instance2);
    });
  });
});
