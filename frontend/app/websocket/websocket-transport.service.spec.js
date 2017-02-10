'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatWebsocketTransportService factory', function() {
  var livenotification, options, transport, chatWebsocketTransportService, $rootScope;
  var onSpy, sendSpy, successSpy, errorSpy;

  beforeEach(function() {
    options = {room: '123'};
    onSpy = sinon.spy();
    sendSpy = sinon.spy();
    successSpy = sinon.spy();
    errorSpy = sinon.spy();
    livenotification = sinon.spy(function() {
      return {
        on: onSpy,
        send: sendSpy
      };
    });
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('livenotification', livenotification);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _chatWebsocketTransportService_) {
    $rootScope = _$rootScope_;
    chatWebsocketTransportService = _chatWebsocketTransportService_;
  }));

  beforeEach(function() {
    transport = new chatWebsocketTransportService(options);
  });

  it('should instanciate correctly', function() {
    expect(transport.options).to.deep.equals(options);
    expect(transport.handlers).to.deep.equals({});
  });

  describe('The addEventListener function', function() {
    it('should add the listener to the sio instance if not null', function() {
      var event = 'message';
      var handler = function() {};

      transport.sio = {
        on: onSpy
      };

      transport.addEventListener(event, handler);

      expect(onSpy).to.have.been.calledWith(event, handler);
    });

    it('should cache the listener if the sio instance is null', function() {
      var event = 'message';
      var handler = function() {};

      transport.addEventListener(event, handler);

      expect(transport.handlers[event]).to.equals(handler);
      expect(onSpy).to.not.have.been.called;
    });
  });

  describe('The connect function', function() {
    it('should skip when sio is already defined', function() {
      transport.sio = {foo: 'bar'};

      transport.connect();

      expect(livenotification).to.not.have.been.called;
    });

    it('should initialize livenotification', function() {
      transport.connect();

      expect(livenotification).to.have.been.calledOnce;
      expect(onSpy).to.have.been.calledOnce;
      expect(onSpy.getCalls()[0].args[0]).to.equal('connected');
    });

    it('should register all the event listeners', function() {
      transport.handlers = {
        a: angular.noop,
        b: angular.noop
      };
      transport.connect();

      expect(livenotification).to.have.been.calledOnce;
      expect(onSpy).to.have.been.calledThrice;
    });
  });

  describe('The sendRawMessage function', function() {
    var type, data;

    beforeEach(function() {
      type = 'message';
      data = {foo: 'bar'};
    });

    it('should reject when websocket is not connected', function() {
      transport.sendRawMessage(type, data).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(sendSpy).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });

    it('should send the message with the websocket instance', function() {
      transport.sio = {
        send: sendSpy
      };

      transport.sendRawMessage(type, data).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(sendSpy).to.have.been.calledWith(type, data);
      expect(successSpy).to.have.been.calledWith(data);
      expect(errorSpy).to.not.have.been.called;
    });
  });

  describe('The sendMessage function', function() {
    var data;

    beforeEach(function() {
      data = {foo: 'bar'};
    });

    it('should reject when websocket is not connected', function() {
      transport.sendMessage(data).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(sendSpy).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });

    it('should send the message with the websocket instance', function() {
      transport.sio = {
        send: sendSpy
      };

      transport.sendMessage(data).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(sendSpy).to.have.been.calledWith('message', data);
      expect(successSpy).to.have.been.calledWith(data);
      expect(errorSpy).to.not.have.been.called;
    });
  });
});
