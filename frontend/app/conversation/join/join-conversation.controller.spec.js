'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ChatJoinConversationController controller', function() {

  var $rootScope, $scope, $controller, $q, conversation, chatLocalStateService, session, conversationId, userId;

  beforeEach(function() {
    conversationId = 1;
    userId = 2;

    conversation = {
      _id: conversationId
    };

    chatLocalStateService = {};

    session = {
      user: {
        _id: userId
      }
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatLocalStateService', chatLocalStateService);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', session);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $controller = _$controller_;
    });
  });

  function initController(conversation, joinCallback) {
    var controller = $controller('ChatJoinConversationController',
      {$scope: $scope},
      {conversation: conversation, onJoin: joinCallback}
    );

    $scope.$digest();

    return controller;
  }

  describe('the join function', function() {

    it('should reject when chatLocalStateService.joinConversation rejects', function() {
      var error = new Error('I failed');
      var onResolve = sinon.spy();
      var onReject = sinon.spy();

      chatLocalStateService.joinConversation = sinon.spy(function() {
        return $q.reject(error);
      });
      initController(conversation).join().then(onResolve, onReject);
      $rootScope.$digest();

      expect(chatLocalStateService.joinConversation).to.have.been.calledWith(conversation);
      expect(onResolve).to.not.have.been.called;
      expect(onReject).to.have.been.calledWith(error);
    });

    it('should resolve when chatLocalStateService.joinConversation resolves', function() {
      chatLocalStateService.joinConversation = sinon.spy(function() {
        return $q.when();
      });

      initController(conversation).join();
      $rootScope.$digest();

      expect(chatLocalStateService.joinConversation).to.have.been.calledWith(conversation);
    });

    it('should call the onJoin callback', function() {
      var spy = sinon.spy();

      chatLocalStateService.joinConversation = sinon.spy(function() {
        return $q.when();
      });
      initController(conversation, spy).join();
      $rootScope.$digest();

      expect(spy).to.have.been.calledWith(userId);
    });

    it('should reject when onJoin rejects', function() {
      var error = new Error('I failed');
      var spy = sinon.spy(function() {
        return $q.reject(error);
      });
      var onResolve = sinon.spy();
      var onReject = sinon.spy();

      chatLocalStateService.joinConversation = sinon.spy(function() {
        return $q.when();
      });
      initController(conversation, spy).join().then(onResolve, onReject);
      $rootScope.$digest();

      expect(spy).to.have.been.calledWith(userId);
      expect(onResolve).to.not.have.been.called;
      expect(onReject).to.have.been.calledWith(error);
    });
  });
});
