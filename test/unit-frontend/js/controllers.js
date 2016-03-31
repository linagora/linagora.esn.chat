'use strict';

/* global chai: false */
/* global sinon: false */

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
    ChatConversationService = {},
    localStorageService = {};

  beforeEach(function() {
    $state = {
      go: sinon.spy()
    };
    windowMock = {
      open: sinon.spy()
    };
    $stateParams = {
      emailId: '4'
    };

    module('linagora.esn.chat', function($provide) {
      $provide.decorator('$window', function($delegate) {
        return angular.extend($delegate, windowMock);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('$stateProvider', $stateProvider);
      $provide.value('ChatConversationService', ChatConversationService);
      $provide.value('localStorageService', localStorageService);
      $provide.value('$state', $state);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$q_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
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
      var channels = [1, 2, 3];
      ChatConversationService.getChannels = function() {
        return $q(channels);
      };
      initCtrl();
      expect(scope.channels).to.deep.equal(channels);
    });

    it('should set the isNotificationEnabled value from user preferences', function() {

    });

    it('should initialize isNotificationEnabled in user preferences if not set', function() {

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
});
