'use strict';

/* global expect, sinon: false */

describe('The ChatLaunchConversationController controller', function() {
  var $rootScope, scope, $controller, chatLaunchConversationServiceMock;

  beforeEach(function() {
    chatLaunchConversationServiceMock = {};

    module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatLaunchConversationService', chatLaunchConversationServiceMock);
      $provide.value('searchProviders', {add: angular.noop});
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  function initController(options) {
    var controller = $controller('ChatLaunchConversationController', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  describe('The launch function', function() {
    it('should call chatLaunchConversationService.launch', function() {
      chatLaunchConversationServiceMock.launch = sinon.spy();
      var onSuccess = angular.noop;
      var userId = 1;
      var controller = initController({userId: userId});

      controller.launch(onSuccess);

      expect(chatLaunchConversationServiceMock.launch).to.have.been.calledWith(userId, onSuccess);
    });
  });
});
