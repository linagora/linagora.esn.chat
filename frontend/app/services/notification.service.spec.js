'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat services', function() {
  var $q,
    chatConversationService,
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
    chatNotificationService,
    chatLocalStateService,
    CHAT_CONVERSATION_TYPE,
    conversationsServiceMock,
    groups,
    channels,
    localStorageService,
    getItem,
    setItem,
    getItemResult;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    user = {_id: 'userId'};

    chatNamespace = {on: sinon.spy()};

    sessionMock = {
      user: user,
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

    conversationsServiceMock = {
      getChannels: function() {
        return $q.when(channels);
      },
      getPrivateConversations: function() {
        return $q.when(groups);
      }
    };

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

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.value('chatConversationsService', conversationsServiceMock);
      $provide.value('localStorageService', localStorageService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _chatConversationService_, _chatNotificationService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _chatUserState_, _$httpBackend_, _chatLocalStateService_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    chatConversationService = _chatConversationService_;
    chatNotificationService = _chatNotificationService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    chatUserState = _chatUserState_;
    $httpBackend =  _$httpBackend_;
    chatLocalStateService = _chatLocalStateService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL}];
  }));

  describe('chatNotificationService service', function() {
    describe('start() method', function() {
      it('should listen to CHAT_EVENTS.TEXT_MESSAGE', function() {
        $rootScope.$on = sinon.spy();
        chatNotificationService.start();
        expect($rootScope.$on).to.have.been.calledWith(CHAT_EVENTS.TEXT_MESSAGE);
      });
    });
  });
});
