'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat services', function() {
  var $q,
    ChatConversationService,
    CHAT_NAMESPACE,
    CHAT_EVENTS,
    sessionMock,
    user,
    listenChatWebsocket,
    livenotificationMock,
    $rootScope,
    userState,
    chatNamespace,
    $httpBackend;

  beforeEach(function() {

    user = {_id: 'userId'};

    chatNamespace = {on: sinon.spy()};

    sessionMock = {
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

    function livenotificationFactory(CHAT_NAMESPACE) {
      livenotificationMock = function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        } else {
          throw new Error(name + 'namespace has not been mocked');
        }
      };
      return livenotificationMock;
    }

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.value('_', _);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _listenChatWebsocket_, _ChatConversationService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _userState_, _$httpBackend_) {
    $q = _$q_;
    listenChatWebsocket = _listenChatWebsocket_;
    ChatConversationService = _ChatConversationService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    userState = _userState_;
    $httpBackend =  _$httpBackend_;
  }));

  describe('listenChatWebsocket', function() {
    describe('initListener', function() {
      beforeEach(function() {
        listenChatWebsocket.initListener();
        $rootScope.$broadcast = sinon.spy();
      });

      it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
          var data = {};
          callback(data);
          expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, data);
          return true;
        }));
      });
    });
  });

  describe('userState service', function() {
    it('should get /chat/api/status/userId to get the data the first time and cache it for the second time', function() {
      var state = 'state';
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/state/userId').respond({state: state});
      userState.get('userId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(state);
      callback.reset();

      userState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });

    it('should save broadcasted change', function() {
      var state = 'of alabama';
      $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, {
        userId: 'userId',
        state: state
      });

      var callback = sinon.spy();
      userState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });
  });

  describe('ChatConversationService service', function() {
  });
});
