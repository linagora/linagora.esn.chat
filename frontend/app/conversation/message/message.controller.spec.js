'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatMessageController controller', function() {

  var $rootScope, $scope, $controller;
  var CHAT_MESSAGE_DISPLAYABLE_TYPES, CHAT_SYSTEM_MESSAGE_SUBTYPES;

  beforeEach(function() {

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _CHAT_MESSAGE_DISPLAYABLE_TYPES_, _CHAT_SYSTEM_MESSAGE_SUBTYPES_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CHAT_MESSAGE_DISPLAYABLE_TYPES = _CHAT_MESSAGE_DISPLAYABLE_TYPES_;
      CHAT_SYSTEM_MESSAGE_SUBTYPES = _CHAT_SYSTEM_MESSAGE_SUBTYPES_;
    });
  });

  function initController(message) {
    var controller = $controller('chatMessageController',
      {$scope: $scope},
      {message: message}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should set displayType to USER when message subtype is not SYSTEM one', function() {
      var message = {subtype: 'abc'};
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();
      expect(controller.displayType).to.equal(CHAT_MESSAGE_DISPLAYABLE_TYPES.USER);
    });

    it('should set displayType to USER when message subtype is undefined', function() {
      var message = {};
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();
      expect(controller.displayType).to.equal(CHAT_MESSAGE_DISPLAYABLE_TYPES.USER);
    });

    it('should set displayType to SYSTEM when message subtype is from CHAT_SYSTEM_MESSAGE_SUBTYPES', function() {

      function test(message) {
        var controller = initController(message);

        controller.$onInit();
        $rootScope.$digest();
        expect(controller.displayType).to.equal(CHAT_MESSAGE_DISPLAYABLE_TYPES.SYSTEM);
      }

      CHAT_SYSTEM_MESSAGE_SUBTYPES.forEach(function(subtype) {
        test({subtype: subtype});
      });
    });

  });
});
