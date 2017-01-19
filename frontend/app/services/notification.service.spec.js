'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat services', function() {
  var $q,
    CHAT_EVENTS,
    sessionMock,
    user,
    livenotificationMock,
    $rootScope,
    chatNamespace,
    chatNotificationService,
    CHAT_CONVERSATION_TYPE,
    conversationsServiceMock,
    chatUsernameMock,
    groups,
    channels,
    localStorageService,
    getItem,
    setItem,
    getItemResult;

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
    })
  );

  beforeEach(function() {

    user = {_id: 'userId'};

    chatNamespace = {on: sinon.spy()};

    chatUsernameMock = {
      generate: angular.noop
    };

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
        setItem: setItem
      })
    };

    function livenotificationFactory(CHAT_NAMESPACE) {
      livenotificationMock = function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        }
        throw new Error(name + 'namespace has not been mocked');
      };

      return livenotificationMock;
    }

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.value('chatConversationsService', conversationsServiceMock);
      $provide.value('localStorageService', localStorageService);
      $provide.value('chatUsername', chatUsernameMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _chatNotificationService_, _CHAT_EVENTS_, _$rootScope_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    chatNotificationService = _chatNotificationService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.OPEN}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.OPEN}];
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
