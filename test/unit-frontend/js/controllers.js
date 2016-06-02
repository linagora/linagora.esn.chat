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
    channelsService,
    groups,
    channels,
    getItemResult,
    getItem,
    setItem,
    localStorageService,
    routeResolver,
    sessionMock,
    user,
    livenotificationMock,
    ChatMessageAdapter,
    chatNotification,
    ChatScroll,
    CHAT_EVENTS;

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

    channelsService = {
      getChannels: sinon.spy(function() {
        return $q.when(channels);
      }),
      getGroups: sinon.spy(function() {
        return $q.when(groups);
      })
    };

    groups = [];
    channels = [];

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

    module('linagora.esn.chat', function($provide) {
      $provide.decorator('$window', function($delegate) {
        return angular.extend($delegate, windowMock);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('$stateProvider', $stateProvider);
      $provide.value('channelsService', channelsService);
      $provide.value('localStorageService', localStorageService);
      $provide.value('session', sessionMock);
      $provide.value('$state', $state);
      $provide.value('livenotification', livenotificationMock);
      $provide.value('ChatMessageAdapter', ChatMessageAdapter);
      $provide.value('ChatScroll', ChatScroll);
      $provide.value('_', _);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_EVENTS_, _chatNotification_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_EVENTS = _CHAT_EVENTS_;
    chatNotification = _chatNotification_;
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

    it('should retrieve user channels', function() {
      initCtrl();
      $rootScope.$digest();
      expect(scope.channels).to.equal(channels);
    });

    it('should retrieve user groups', function() {
      initCtrl();
      $rootScope.$digest();
      expect(scope.groups).to.equal(groups);
    });

    it('should set the isNotificationEnabled value from chatNotification service', function() {
      initCtrl();
      expect(chatNotification.isEnabled).to.have.been.called;
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

  describe('chatChannelSubheaderController', function() {
    function initCtrl() {
      return initController('chatChannelSubheaderController');
    }

    beforeEach(function() {
      $rootScope.$on = sinon.spy();
      initCtrl();
    });

    it('should listen CHAT_EVENTS.SWITCH_CURRENT_CHANNEL and put new channel on the scope', function() {
      expect($rootScope.$on).to.have.been.calledWith(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, sinon.match.func.and(sinon.match(function(callback) {
        var channel = {};
        callback(null, channel);
        expect(scope.channel).to.equal(channel);
        return true;
      })));
    });
  });
});
