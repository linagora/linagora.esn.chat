'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ChatFooterController controller', function() {

  var $rootScope, $scope, $controller, conversation, session, conversationId, userId;

  beforeEach(function() {

    conversationId = 1;
    userId = 2;

    conversation = {
      _id: conversationId
    };

    session = {
      user: {
        _id: userId
      }
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('session', session);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _session_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      session = _session_;
    });
  });

  function initController(conversation) {
    var controller = $controller('ChatFooterController',
      {$scope: $scope},
      {conversation: conversation}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should set isMember flag to true when user is in conversation members', function() {
      conversation.members = [{_id: userId}];

      var controller = initController(conversation);

      controller.$onInit();
      expect(controller.isMember).to.be.true;
    });

    it('should set isMember flag to false when user is not in conversation members', function() {
      conversation.members = [{_id: 'A'}, {_id: 'B'}];

      var controller = initController(conversation);

      controller.$onInit();
      expect(controller.isMember).to.be.false;
    });

  });

  describe('the onJoin function', function() {

    it('should set isMember flag to true', function() {
      var controller = initController(conversation);

      controller.onJoin();
      expect(controller.isMember).to.be.true;
    });
  });
});
