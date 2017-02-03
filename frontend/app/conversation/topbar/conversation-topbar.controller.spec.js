'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationTopbarController controller', function() {
  var conversation,
    $rootScope,
    $scope,
    chatConversationActionsService,
    $controller;

  beforeEach(function() {
    chatConversationActionsService = {};
    conversation = {_id: 1};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  describe('The updateTopic function', function() {
    function initController() {
      var controller = $controller('ChatConversationTopbarController',
        {$scope: $scope},
        {conversation: conversation}
      );

      $scope.$digest();

      return controller;
    }

    it('should call chatConversationsService.updateConversationTopic', function() {
      var topic = {name: 'MyTopic'};

      chatConversationActionsService.updateConversationTopic = sinon.spy();

      var controller = initController();

      controller.topic = topic;
      controller.updateTopic(topic);
      $rootScope.$digest();

      expect(chatConversationActionsService.updateConversationTopic).to.have.been.calledWith(topic, conversation._id);
    });
  });
});
