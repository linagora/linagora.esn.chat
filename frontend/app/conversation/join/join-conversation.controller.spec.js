'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ChatJoinConversationController controller', function() {

  var $rootScope, $scope, $controller, $q, conversation, chatConversationService, chatLocalStateService, searchProviders, session, conversationId, userId;

  beforeEach(function() {

    conversationId = 1;
    userId = 2;

    conversation = {
      _id: conversationId
    };

    chatConversationService = {
      join: sinon.spy(function() {
        return $q.when();
      })
    };

    chatLocalStateService = {
      updateConversation: sinon.spy(function() {
        return $q.when();
      })
    };

    searchProviders = {
      add: sinon.spy()
    };

    session = {
      user: {
        _id: userId
      }
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatConversationService', chatConversationService);
      $provide.value('chatLocalStateService', chatLocalStateService);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', session);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _$state_, _chatConversationService_, _chatLocalStateService_, _session_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $controller = _$controller_;
      chatConversationService = _chatConversationService_;
      chatLocalStateService = _chatLocalStateService_;
      session = _session_;
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

    it('should join conversation', function() {
      initController(conversation).join();
      $rootScope.$digest();

      expect(chatConversationService.join).to.have.been.calledWith(conversationId, userId);
      expect(chatLocalStateService.updateConversation).to.have.been.calledWith(conversationId);
    });

    it('should call the onJoin callback', function() {
      var spy = sinon.spy();

      initController(conversation, spy).join();
      $rootScope.$digest();

      expect(spy).to.have.been.calledWith(userId);
    });
  });
});
