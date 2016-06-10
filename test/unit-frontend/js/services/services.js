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
    livenotificationMock,
    $rootScope,
    scope,
    chatUserState,
    chatNamespace,
    $httpBackend,
    getItemResult,
    getItem,
    setItem,
    localStorageService,
    chatNotification;

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

    getItemResult = 'true';
    getItem = sinon.spy(function(key) {
      return $q.when(({
        isNotificationEnabled: getItemResult
      })[key]);
    });
    setItem = sinon.spy(function() {
      return $q.when({});
    });
    localStorageService = {
      getOrCreateInstance: sinon.stub().returns({
        getItem: getItem,
        setItem:  setItem
      })
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.value('_', _);
      $provide.value('localStorageService', localStorageService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _ChatConversationService_, _chatNotification_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _chatUserState_, _$httpBackend_) {
    $q = _$q_;
    ChatConversationService = _ChatConversationService_;
    chatNotification = _chatNotification_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    chatUserState = _chatUserState_;
    $httpBackend =  _$httpBackend_;
  }));

  describe('chatUserState service', function() {

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var data = {};
        callback(data);
        expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, data);
        return true;
      }));
    });

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and save change', function() {
      $rootScope.$broadcast = sinon.spy();
      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var state = 'of alabama';
        callback({
          userId: 'userId',
          state: state
        });
        var promiseCallback = sinon.spy();
        chatUserState.get('userId').then(promiseCallback);
        $rootScope.$digest();
        expect(promiseCallback).to.have.been.calledWith(state);
        return true;
      }));
    });

    it('should get /chat/api/status/userId to get the data the first time and cache it for the second time', function() {
      var state = 'state';
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/state/userId').respond({state: state});
      chatUserState.get('userId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(state);
      callback.reset();

      chatUserState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });
  });

  describe('ChatConversationService service', function() {
  });

  describe('chatNotification service', function() {
    describe('start() method', function() {
      it('should listen to $rootScope CHAT_EVENTS.TEXT_MESSAGE events', function() {
        $rootScope.$on = sinon.spy();
        chatNotification.start();
        expect($rootScope.$on).to.have.been.calledWith(CHAT_EVENTS.TEXT_MESSAGE);
      });

      it('should read the isNotificationEnabled value from user preferences', function() {
        chatNotification.start();
        expect(localStorageService.getOrCreateInstance).to.have.been.calledWith('linagora.esn.chat');
        expect(getItem).to.have.been.calledWith('isNotificationEnabled');
      });

    });
  });
});
