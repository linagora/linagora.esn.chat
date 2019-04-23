'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatMemberAddController controller', function() {

  var $rootScope, scope, $controller, $stateParams, CHAT;

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

  beforeEach(inject(function(_$rootScope_, _$controller_, _CHAT_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT = _CHAT_;
  }));

  function initController(options) {
    options = options || {};
    var controller = $controller('ChatMemberAddController as ctrl', {$scope: scope, ELEMENTS_PER_REQUEST: options.ELEMENTS_PER_REQUEST }, options);

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

    it('should set options when ELEMENTS_PER_REQUEST is not provided', function() {
      $stateParams.conversation = true;

      var controller = initController({ELEMENTS_PER_REQUEST: null});

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.options).to.deep.equal({
        limit: CHAT.DEFAULT_FETCH_SIZE,
        offset: CHAT.DEFAULT_FETCH_OFFSET
      });
    });

    it('should set options when ELEMENTS_PER_REQUEST is provided', function() {
      $stateParams.conversation = true;

      var controller = initController({ELEMENTS_PER_REQUEST: 50});

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.options).to.deep.equal({
        limit: 50,
        offset: CHAT.DEFAULT_FETCH_OFFSET
      });
    });
  });
});
