'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatMemberAddController controller', function() {

  var $rootScope, scope, $controller, $stateParams;

  beforeEach(function() {
    $stateParams = {};
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  function initController(options) {
    var controller = $controller('ChatMemberAddController as ctrl', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {
    it('should set self.conversation to the conversation received on the $stateParams', function() {
      $stateParams.conversation = {
        objectType: 'chat'
      };

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.conversation).to.deep.equal($stateParams.conversation);
    });

    it('should not set self.conversation value if $stateParams.conversation is undefined', function() {
      var controller = initController();

      controller.conversation = 'foo';

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.conversation).to.deep.equal('foo');
    });
  });
});
