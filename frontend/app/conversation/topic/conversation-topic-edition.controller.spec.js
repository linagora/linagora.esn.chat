'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationTopicEditionController controller', function() {
  var conversation,
    $rootScope,
    $scope,
    chatConversationActionsService,
    $controller;

    function initController() {
      var controller = $controller('ChatConversationTopicEditionController',
        {$scope: $scope},
        {conversation: conversation}
      );

      $scope.$digest();

      return controller;
    }

  beforeEach(function() {
    chatConversationActionsService = {};
    conversation = {_id: 1};
    conversation.topic = {value: 'test'};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  describe('The updateTopic function', function() {

    it('should call chatConversationsService.updateConversationTopic', function() {
      var topic = 'MyTopic';

      chatConversationActionsService.updateConversationTopic = sinon.spy();

      var controller = initController();

      controller.updateTopic(topic);
      $rootScope.$digest();

      expect(chatConversationActionsService.updateConversationTopic).to.have.been.calledWith(conversation, topic);
    });
  });

  describe('The $onInit function', function() {

    it('should set topic to conversation.topic.value', function() {

      var controller = initController();

      controller.$onInit();

      expect(controller.topic).to.equal(conversation.topic.value);
    });
  });

  describe('The draft function', function() {

    it('should set topic to conversation.topic.value', function() {
      var unsavedTopic = 'Test Topic';
      var controller = initController();

      controller.draft(unsavedTopic);

      expect(controller.topic).to.equal(unsavedTopic);
    });
  });
});
