'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ChatConversationItemIconDmController controller', function() {
  var $rootScope, $scope, $controller, session, user, current;

  beforeEach(function() {
    user = {
      _id: 1
    };
    current = {
      member: {
        id: user._id
      }
    };
    session = {
      user: user
    };
  });

  beforeEach(function() {
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  function getNewController(conversation) {
    var controller = $controller('ChatConversationItemIconDmController',
      {$scope: $scope},
      {conversation: conversation}
    );

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    var conversation;

    beforeEach(function() {
      conversation = {
        _id: 1,
        members: []
      };
    });

    it('should set ctrl.otherUserId to undefined when there are no other member', function() {
      var controller = getNewController(conversation);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.otherUserId).to.not.be.defined;
    });

    it('should set ctrl.otherUserId to undefined if current user is the only one in conversation', function() {
      conversation.members.push(current);

      var controller = getNewController(conversation);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.otherUserId).to.not.be.defined;
    });

    it('should set ctrl.otherUserId to the other member id', function() {
      var member = {
        member: {
          id: 2
        }
      };

      conversation.members.push(current);
      conversation.members.push(member);

      var controller = getNewController(conversation);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.otherUserId).to.equal(member.member.id);
    });
  });
});
