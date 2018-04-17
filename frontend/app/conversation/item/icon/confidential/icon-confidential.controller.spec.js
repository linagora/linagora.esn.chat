'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ChatConversationItemIconConfidentialController controller', function() {
  var $rootScope, $scope, $controller;

  beforeEach(function() {
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  function getNewController(conversation) {
    var controller = $controller('ChatConversationItemIconConfidentialController',
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
        members_count: 0
      };
    });

    it('should set ctrl.icon to mdi-numeric-9-plus-box when there are more than 10 members', function() {
      conversation.members_count = 11;

      var controller = getNewController(conversation);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.icon).to.equal('mdi-numeric-9-plus-box');
    });

    it('should set ctrl.icon members length - 1 when there are up to 10 members', function() {
      for (var i = 1; i <= 10; i++) {
        test(i);
      }

      function test(size) {
        conversation.members_count = size;

        var controller = getNewController(conversation);

        controller.$onInit();
        $rootScope.$digest();

        expect(controller.icon).to.equal('mdi-numeric-' + (size - 1) + '-box');
      }
    });
  });
});
