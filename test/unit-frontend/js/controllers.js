'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat module controllers', function() {
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
    routeResolver,
    sessionMock,
    user,
    livenotificationMock,
    CHAT_CONVERSATION_TYPE,
    ChatMessageAdapter,
    chatNotificationService,
    chatScrollService,
    CHAT_EVENTS,
    getItemResult,
    getItem,
    setItem,
    localStorageService,
    chatConversationsService,
    chatLocalStateService,
    chatLocalStateServiceMock;

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
        setItem:  setItem
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

    routeResolver = {
      session: angular.noop
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

    module('linagora.esn.chat', function($provide) {
      $provide.decorator('$window', function($delegate) {
        return angular.extend($delegate, windowMock);
      });
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
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_EVENTS_, _chatNotificationService_, _chatLocalStateService_, _CHAT_CONVERSATION_TYPE_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_EVENTS = _CHAT_EVENTS_;
    chatNotificationService = _chatNotificationService_;
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

  describe('The chatRootController controller', function() {

    function initCtrl() {
      return initController('chatRootController');
    }

    it('should instanciate chatLocalStateService', function() {
      initCtrl();
      $rootScope.$digest();
      expect(scope.chatLocalStateService).to.be.equal(chatLocalStateService);
    });

    it('should call setActive with the default channel', function() {
      initCtrl();
      $rootScope.$digest();
      expect(chatLocalStateService.setActive).to.be.calledWith(channels[0]._id);
    });

    it('should set the isNotificationEnabled value from chatNotificationService service', function() {
      initCtrl();
      chatNotificationService.setNotificationStatus(true);
      expect(scope.isEnabled()).to.be.equal(true);
    });
  });

  describe('The chatController controller', function() {
    it('should inject the subheader', function() {
    });

    it('should fetch channel messages from server', function() {

    });

    it('should add message on scope on chat:message:text scope event', function() {

    });

    describe('The newMessage function', function() {
      it('should notify user', function() {

      });

      it('should set the channel.isNotRead flag to true when target is not the current channel', function() {

      });

      it('should populate the message, push it in the scope and scroll down', function() {

      });
    });

    describe('The notifyNewMessage function', function() {
      it('should show notification when window has focus', function() {

      });

      it('and should show notification when conversation is read', function() {

      });

      it('and should show notification when notification is enabled', function() {

      });

      it('and should show notification when user is not current one', function() {

      });
    });

  });

  describe('The chatAddChannelController controller', function() {

    it('should add the subheader', function() {

    });

    describe('The addChannel function', function() {
      it('should create the channel', function() {

      });

      it('should change to channel view when created', function() {

      });

      it('should add channel in scope when created', function() {

      });
    });
  });

  describe('chatConversationSubheaderController', function() {
    function initCtrl() {
      return initController('chatConversationSubheaderController');
    }

    beforeEach(function() {
      $rootScope.$on = sinon.spy();
      initCtrl();
    });
  });
});
