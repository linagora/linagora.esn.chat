'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatSummaryDetailsController Controller ', function() {
  var $rootScope,
      $scope,
      $controller,
      controller,
      user,
      creator,
      chatConversationActionsServiceMock,
      chatUsernameMock;

  beforeEach(function() {

    user = {
      _id: 'userId',
      name: 'user'
    };

    chatConversationActionsServiceMock = {
      currentUserIsCreator: sinon.spy(function() {
        return user._id === creator._id;
      })
    };

    chatUsernameMock = {
      getFromCache: sinon.spy(function() {
        return $q.when(user.name);
      }),
      generate: sinon.spy(function() {
        return user.name;
      })
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('newProvider', function(_provider) {
        return _provider;
      });
      $provide.value('chatUsername', chatUsernameMock);
      $provide.value('session', {user: user});
      $provide.value('chatConversationActionsService', chatConversationActionsServiceMock);
      $provide.value('chatSearchProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  beforeEach(function() {
    function initController() {
      var controller = $controller('chatSummaryDetailsController', {
        $scope: $scope
      });

      $scope.$digest();

      return controller;
    }

    controller = initController();
  });

  describe('the $onInit function', function() {

    it('should affect true to userIsCreator if the actual user is the creator of the conversation', function() {
      creator = {
        _id: 'userId'
      };

      controller.creator = creator;
      controller.$onInit();
      $scope.$digest();

      expect(controller.userIsCreator).to.be.true;
    });

    it('should affect false to userIsCreator if the actual user is not the creator of the conversation', function() {
      creator = {
        _id: 'otherId'
      };

      controller.creator = creator;
      controller.$onInit();
      $scope.$digest();

      expect(controller.userIsCreator).to.be.false;
    });
  });
});
