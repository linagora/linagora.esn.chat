'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat ChatController controller', function() {
  var $state,
    $q,
    windowMock,
    $stateParams,
    $stateProvider,
    scope,
    $rootScope,
    $controller,
    groups,
    channels,
    sessionMock,
    user,
    livenotificationMock,
    CHAT_CONVERSATION_TYPE,
    ChatMessageAdapter,
    chatScrollService,
    getItemResult,
    getItem,
    setItem,
    localStorageService,
    chatConversationsService,
    chatLocalStateService,
    chatLocalStateServiceMock,
    searchProviders;

  beforeEach(function() {
    $state = {
      go: sinon.spy()
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

    chatConversationsService = {
      getChannels: sinon.spy(function() {
        return $q.when(channels);
      }),
      getPrivateConversations: sinon.spy(function() {
        return $q.when(groups);
      })
    };

    windowMock = {
      open: sinon.spy()
    };
    $stateParams = {
      emailId: '4'
    };

    user = {_id: 'userId'};

    sessionMock = {
      ready: { then: _.constant(user)}
    };

    livenotificationMock = {
    };

    chatLocalStateServiceMock = {
      activeRoom: {},
      setActive: sinon.spy()
    };

    searchProviders = {
      add: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.decorator('$window', function($delegate) {
        return angular.extend($delegate, windowMock);
      });
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('$stateParams', $stateParams);
      $provide.value('$stateProvider', $stateProvider);
      $provide.value('chatConversationsService', chatConversationsService);
      $provide.value('localStorageService', localStorageService);
      $provide.value('session', sessionMock);
      $provide.value('$state', $state);
      $provide.value('livenotification', livenotificationMock);
      $provide.value('ChatMessageAdapter', ChatMessageAdapter);
      $provide.value('chatScrollService', chatScrollService);
      $provide.value('chatLocalStateService', chatLocalStateServiceMock);
      $provide.value('chatParseMention', {});
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _chatLocalStateService_, _CHAT_CONVERSATION_TYPE_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    chatLocalStateService = _chatLocalStateService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL}];
    chatLocalStateService.channels = channels;
    chatLocalStateService.privateConversations = groups;
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  describe('The ChatController controller', function() {

    function initCtrl() {
      return initController('ChatController as vm');
    }

    it('should instanciate chatLocalStateService', function() {
      initCtrl();
      $rootScope.$digest();
      expect(scope.vm.chatLocalStateService).to.be.equal(chatLocalStateService);
    });

    it('should call setActive with the default channel', function() {
      initCtrl();
      $rootScope.$digest();
      expect(chatLocalStateService.setActive).to.be.calledWith(channels[0]._id);
    });
  });
});
