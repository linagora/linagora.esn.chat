'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat messages services', function() {
  var $q,
  $logMock,
  CHAT_EVENTS,
  sessionMock,
  user,
  domain,
  $rootScope,
  chatMessageService,
  ChatTransportMock,
  ChatTransportMockInstance,
  fileUploadServiceMock,
  backgroundProcessorServiceMock,
  sessionFactory,
  DEFAULT_FILE_TYPE;

  beforeEach(function() {
    user = {_id: 'userId'};
    domain = {_id: 'domainId'};

    sessionFactory = function($q) {
      sessionMock = {
        ready: $q.when({user: user, domain: domain})
      };

      return sessionMock;
    };

    $logMock = {
      debug: angular.noop,
    };
  });

  describe('chatMessageService', function() {
    beforeEach(function() {

      ChatTransportMock = sinon.spy(function() {
        var self = this;
        ChatTransportMockInstance = self;
        this.connect = sinon.spy();
        this.sendMessage = sinon.spy(function() {
          return $q.when({});
        });
      });

      fileUploadServiceMock = {};

      backgroundProcessorServiceMock = {};

      DEFAULT_FILE_TYPE = 'DEFAULT_FILE_TYPE';

      module('linagora.esn.chat', function($provide) {
        $provide.value('searchProviders', {
          add: sinon.spy()
        });
        $provide.value('chatSearchMessagesProviderService', {});
        $provide.factory('session', sessionFactory);
        $provide.value('ChatTransportService', ChatTransportMock);
        $provide.value('backgroundProcessorService', backgroundProcessorServiceMock);
        $provide.value('fileUploadService', fileUploadServiceMock);
        $provide.value('DEFAULT_FILE_TYPE', DEFAULT_FILE_TYPE);
      });
    });

    beforeEach(angular.mock.inject(function(_$q_, _CHAT_EVENTS_, _$rootScope_, _chatMessageService_) {
      $q = _$q_;
      CHAT_EVENTS = _CHAT_EVENTS_;
      $rootScope = _$rootScope_;
      chatMessageService = _chatMessageService_;
      sessionMock.ready = $q.when({user: user, domain: domain});
    }));

    it('should pass correct argument when constructing transport object', function() {
      $rootScope.$digest();
      expect(ChatTransportMock).to.have.been.calledWith({
        user: 'userId',
        room: 'domainId'
      });
    });

    describe('sendMessage function', function() {
      it('should send a message with text as type', function() {
        var promiseCallback = sinon.spy();
        chatMessageService.sendMessage({data: 'data'}).then(promiseCallback);
        $rootScope.$digest();
        expect(ChatTransportMockInstance.sendMessage).to.have.been.calledWith({data: 'data', type: 'text'});
        expect(promiseCallback).to.have.been.calledOnce;
      });
    });

    describe('sendUserTyping function ', function() {
      it('should send a message with user_typing as type', function() {
        var promiseCallback = sinon.spy();
        chatMessageService.sendUserTyping({data: 'data'}).then(promiseCallback);
        $rootScope.$digest();
        expect(ChatTransportMockInstance.sendMessage).to.have.been.calledWith({data: 'data', type: 'user_typing'});
        expect(promiseCallback).to.have.been.calledOnce;
      });
    });

    describe('connect function', function() {
      it('should call transport.connect only once', function() {
        chatMessageService.connect();
        $rootScope.$digest();
        chatMessageService.connect();
        expect(ChatTransportMockInstance.connect).to.have.been.calledOnce;
      });

      describe('connect given handler', function() {
        var callback;
        beforeEach(function() {
          chatMessageService.connect();
          $rootScope.$digest();
          expect(ChatTransportMockInstance.connect).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(_callback_) {
            callback = _callback_;
            return true;
          })));
        });

        it('shoud broadcast chat:message:type where type is the type of the receiving message', function() {
          $rootScope.$broadcast = sinon.spy();
          var message = {type: 'aType'};
          callback(message);
          expect($rootScope.$broadcast).to.have.been.calledWith('chat:message:' + message.type, sinon.match.same(message));
        });

        it('shoud broadcast chat:message:type where type is the type of the receiving message', function() {
          $rootScope.$broadcast = sinon.spy();
          var message = {type: 'aType'};
          callback(message);
          expect($rootScope.$broadcast).to.have.been.calledWith('chat:message:' + message.type, sinon.match.same(message));
        });

        it('should ignore user_typing from myself', function() {
          $rootScope.$broadcast = sinon.spy();
          var message = {type: 'user_typing', creator: 'userId'};
          callback(message);
          expect($rootScope.$broadcast).to.have.not.been.calledOnce;
        });

        it('should broadcast text message from myself', function() {
          $rootScope.$broadcast = sinon.spy();
          var message = {type: 'text', creator: 'userId'};
          callback(message);
          expect($rootScope.$broadcast).to.have.been.calledOnce;
        });
      });
    });

    describe('sendMessageWithAttachments', function() {
      //TODO
    });
  });

  describe('ChatTransportService', function() {
    var ChatTransportService, CHAT_NAMESPACE, livenotificationMock, chatSioMock;

    beforeEach(function() {

      ChatTransportMock = sinon.spy(function() {
        var self = this;
        ChatTransportMockInstance = self;
        this.connect = sinon.spy();
        this.sendMessage = sinon.spy(function() {
          return $q.when({});
        });
      });

      fileUploadServiceMock = {};

      backgroundProcessorServiceMock = {};

      chatSioMock = {
        on: sinon.spy(),
        connect: sinon.spy(),
        send: sinon.spy()
      };

      function livenotificationFactory(CHAT_NAMESPACE) {
        livenotificationMock = sinon.spy(function(name) {
          if (name === CHAT_NAMESPACE) {
            return chatSioMock;
          } else {
            throw new Error('Not mocked namespace' + name);
          }
        });
        return livenotificationMock;
      }

      DEFAULT_FILE_TYPE = 'DEFAULT_FILE_TYPE';

      module('linagora.esn.chat', function($provide) {
        $provide.value('searchProviders', {
          add: sinon.spy()
        });
        $provide.value('chatSearchMessagesProviderService', {});
        $provide.factory('session', sessionFactory);
        $provide.factory('livenotification', livenotificationFactory);
      });
    });

    beforeEach(angular.mock.inject(function(_ChatTransportService_, _CHAT_NAMESPACE_) {
      ChatTransportService = _ChatTransportService_;
      CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    }));

    var instance, onMessage;
    beforeEach(function() {
      onMessage = sinon.spy();
      instance = new ChatTransportService({room: 'roomId'});
      instance.connect(onMessage);
    });

    describe('ChatTransportService connect function', function() {

      it('should connect to CHAT_NAMESPACE in the good room', function() {
        expect(livenotificationMock).to.have.been.calledWith(CHAT_NAMESPACE, 'roomId');
      });

      it('should listen for message and pass them to the given callback', function() {
        expect(chatSioMock.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(callback) {
          var message = {};
          callback(message);
          expect(onMessage).to.have.been.calledWith(message);
          return true;
        })));
      });
    });

    describe('sendMessage function', function() {
      it('should pass message to sio', function() {
        var message = {};
        instance.sendMessage(message);
        expect(chatSioMock.send).to.have.been.calledWith('message', message);
      });
    });
  });
});
