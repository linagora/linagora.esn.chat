'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationTopbarController controller', function() {
  var conversation,
    $rootScope,
    $scope,
    chatConversationsService,
    $controller;

  beforeEach(function() {
    chatConversationsService = {};
    conversation = {_id: 1};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationsService', chatConversationsService);
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

      chatConversationsService.updateConversationTopic = sinon.spy();

      var controller = initController();

      controller.topic = topic;
      controller.updateTopic(topic);
      $rootScope.$digest();

      expect(chatConversationsService.updateConversationTopic).to.have.been.calledWith(topic, conversation._id);
    });
  });
});
