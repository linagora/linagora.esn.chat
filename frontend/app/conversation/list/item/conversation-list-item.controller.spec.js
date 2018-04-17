'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ChatConversationListItemController controller', function() {

  var $rootScope, $scope, $controller, conversation, $state, CHAT_MEMBER_STATUS;

  beforeEach(function() {
    conversation = {_id: 1};
    $state = {
      go: sinon.spy()
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
      $provide.value('$state', $state);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _CHAT_MEMBER_STATUS_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CHAT_MEMBER_STATUS = _CHAT_MEMBER_STATUS_;
    });
  });

  function initController(context) {
    var controller = $controller('ChatConversationListItemController',
      {$scope: $scope},
      context
    );

    $scope.$digest();

    return controller;
  }

  describe('the onJoin function', function() {
    it('should call $state.go with right parameters', function() {
      initController({conversation: conversation}).onJoin();
      $rootScope.$digest();

      expect($state.go).to.have.been.calledWith('chat.channels-views', {id: conversation._id});
    });
  });

  describe('the $onInit function', function() {
    it('should set self.isMember to true when user is member', function() {
      conversation.member_status = CHAT_MEMBER_STATUS.MEMBER;
      var controller = initController({conversation: conversation});

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.isMember).to.be.true;
    });

    it('should set self.isMember to false when user is not member', function() {
      conversation.member_status = CHAT_MEMBER_STATUS.NONE;
      var controller = initController({conversation: conversation});

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.isMember).to.be.false;
    });
  });
});
