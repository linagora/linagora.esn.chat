'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationTopbarController controller', function() {
  var conversation,
    $rootScope,
    $scope,
    chatConversationMemberService,
    $controller;

  beforeEach(function() {
    chatConversationMemberService = {};
    conversation = {_id: 1};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationMemberService', chatConversationMemberService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  describe('The $onInit function', function() {
    function initController() {
      var controller = $controller('ChatConversationTopbarController',
        {$scope: $scope},
        {conversation: conversation}
      );

      $scope.$digest();

      return controller;
    }

    it('should set the userIsMember property to the result of chatConversationMemberService.currentUserIsMemberOf', function() {
      var result = 'MyResult';

      chatConversationMemberService.currentUserIsMemberOf = sinon.spy(function() {
        return result;
      });

      var controller = initController();

      controller.$onInit();

      expect(chatConversationMemberService.currentUserIsMemberOf).to.have.been.calledWith(conversation);
      expect(controller.userIsMember).to.deep.equal(result);
    });
  });
});
