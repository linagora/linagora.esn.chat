'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatMessageIndicatorController controller', function() {
  var $rootScope,
      scope,
      $controller,
      sessionMock,
      chatLocalStateServiceMock,
      chatScrollServiceMock,
      CHAT_EVENTS,
      user,
      searchProviders,
      inview,
      message,
      channel;

  beforeEach(function() {

    channel = 1;

    chatScrollServiceMock = {
      scrollDown: sinon.spy()
    };

    user = {_id: 'userId'};

    sessionMock = {user: user};

    chatLocalStateServiceMock = {
      activeRoom: {}
    };

    searchProviders = {
      add: sinon.spy()
    };

    inview = false;

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('chatLocalStateService', chatLocalStateServiceMock);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('searchProviders', searchProviders);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _session_, _chatLocalStateService_, _chatScrollService_, _CHAT_EVENTS_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl,
      {$scope: scope},
      {inview: inview}
    );

    scope.$digest();

    return controller;
  }

  beforeEach(function() {
    message = {_id: 1, creator: {_id: 'userId'}, timestamps: {creation: 3}};
  });

  describe('The manualScrollDown function', function() {

    it('should call chatScrollService.scrollDown()', function() {

      initController('ChatMessageIndicatorController as ctrl');

      scope.ctrl.manualScrollDown();
      $rootScope.$digest();

      expect(chatScrollServiceMock.scrollDown).to.be.called;
    });

    it('should reset the number of unread message', function() {

      message.creator._id = 'anId';
      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initController('ChatMessageIndicatorController as ctrl');

      scope.ctrl.unreads = 5;
      scope.ctrl.manualScrollDown();
      $rootScope.$digest();

      expect(scope.ctrl.unreads).to.deep.equal(0);
    });

    it('should set the message indicator flag to false', function() {

      message.creator._id = 'anId';
      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initController('ChatMessageIndicatorController as ctrl');

      scope.ctrl.show = true;
      scope.ctrl.manualScrollDown();

      $rootScope.$digest();
      expect(scope.ctrl.show).to.be.false;
    });
  });

  describe('the $onChanges function', function() {

    it('should calculate the number of unread messages', function() {

      message.creator._id = 'anId';
      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initController('ChatMessageIndicatorController as ctrl');

      scope.ctrl.$onChanges({ inview: {currentValue: false} });

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);

      expect(scope.ctrl.unreads).to.deep.equal(4);

      scope.ctrl.$onChanges({ inview: {currentValue: true} });
      $rootScope.$digest();

      expect(scope.ctrl.unreads).to.deep.equal(0);
    });

    it('should display and hide the message indicator', function() {

      message.creator._id = 'anId';
      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initController('ChatMessageIndicatorController as ctrl');
      $rootScope.$digest();

      expect(scope.ctrl.show).to.be.false;

      scope.ctrl.$onChanges({ inview: {currentValue: false} });

      expect(scope.ctrl.show).to.be.true;
    });
  });

});
