'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationSidebarSummaryController Controller ', function() {
  var $q,
      $rootScope,
      $scope,
      $controller,
      summary,
      conversation,
      controller,
      chatConversationsStoreServiceMock,
      chatConversationServiceMock,
      chatUsernameMock;

  beforeEach(function() {
    summary = {
      _id: 'conversationId'
    };

    chatConversationsStoreServiceMock = {
      activeRoom: sinon.spy(function() {
        return $q.when(conversation);
      })
    };

    chatConversationServiceMock = {
      getSummary: sinon.spy(function() {
        return $q.when(summary);
      })
    };

    chatUsernameMock = {};

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('newProvider', function(_provider) {
        return _provider;
      });
      $provide.value('chatUsername', chatUsernameMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('chatConversationService', chatConversationServiceMock);
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  beforeEach(function() {
    function initController() {
      var controller = $controller('chatConversationSidebarSummaryController', {
        $scope: $scope
      });

      $scope.$digest();

      return controller;
    }

    controller = initController();
  });

  describe('the $onInit function', function() {
    it('should call the chatConversationService.getSummary method', function() {
      controller.$onInit();

      expect(chatConversationServiceMock.getSummary).to.have.been.called;
    });

    it('should affect true to isConversationPublic if conversation.type equal to open', function() {
      controller.conversation = {
        type: 'open'
      };

      controller.$onInit();
      $scope.$digest();

      expect(controller.isPublicConversation).to.be.true;
    });

    it('should not affect true to isConversationPublic if conversation.type does not equal to open', function() {
      controller.conversation = {
        type: 'private'
      };

      controller.$onInit();
      $scope.$digest();

      expect(controller.isPublicConversation).to.be.false;
    });
  });
});
