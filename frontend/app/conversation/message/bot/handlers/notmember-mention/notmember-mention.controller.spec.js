'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageController controller', function() {

  var $rootScope, $scope, $controller;
  var chatConversationActionsService = {};

  beforeEach(function() {

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });

    angular.mock.inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
    });
  });

  function initController(userMentions) {
    var controller = $controller('chatBotMessageNotMemberMentionController',
      {$scope: $scope},
      {userMentions: userMentions}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should call chatBotMessageService resolve\'s method', function() {
      var userMentions = ['userId', 'userId2'];
      var controller = initController(userMentions);

      chatConversationActionsService.addMember = sinon.spy();
      controller.$onInit();
      $rootScope.$digest();

      expect(controller.addMembers).to.be.an('function');

      controller.addMembers(userMentions);

      expect(chatConversationActionsService.addMember).to.have.been.calledTwice;
    });
  });
});
