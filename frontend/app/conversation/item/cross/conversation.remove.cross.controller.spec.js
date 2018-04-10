'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationRemoveCrossController controller', function() {
  var chatConversationActionsServiceMock,
  chatConversationsStoreServiceMock,
  $state,
  $scope,
  $q,
  $controller,
  $rootScope;

  beforeEach(function() {

    chatConversationActionsServiceMock = {
      unsubscribePrivateConversation: sinon.spy(function() {
        return $q.when();
      })
    };

    chatConversationsStoreServiceMock = {
      isActiveRoom: sinon.spy(function() {
        return true;
      }),
      channels: [{_id: '1'}]
    };

    $state = {
      go: sinon.spy()
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('$state', $state);
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('chatConversationActionsService', chatConversationActionsServiceMock);
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  describe('The unsubscribe function', function() {
    var conversation;

    function initController() {
      var controller = $controller('chatConversationRemoveCrossController',
        {$scope: $scope},
        {conversation: conversation}
      );

      $scope.$digest();

      return controller;
    }

    beforeEach(function() {
      conversation = {
        _id: 1
      };
    });

    it('should unsubscribe and switch channel if the channel is active ', function() {
      var controller = initController();

      controller.unsubscribe();
      $rootScope.$digest();
      expect(chatConversationsStoreServiceMock.isActiveRoom).to.have.been.called;
      expect(chatConversationActionsServiceMock.unsubscribePrivateConversation).to.have.been.called;
      expect($state.go).to.have.been.called;
    });

    it('should unsubscribe and not switch channel if the channel is not active ', function() {
      chatConversationsStoreServiceMock.isActiveRoom = sinon.spy(function() {
        return false;
      });
      var controller = initController();

      controller.unsubscribe();
      $rootScope.$digest();
      expect(chatConversationsStoreServiceMock.isActiveRoom).to.have.been.called;
      expect(chatConversationActionsServiceMock.unsubscribePrivateConversation).to.have.been.called;
      expect($state.go).to.not.have.been.called;
    });
  });
});
