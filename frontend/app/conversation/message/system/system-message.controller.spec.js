'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatSystemMessageController controller', function() {

  var $q, $rootScope, $scope, $controller, $translate;
  var chatParseMention;

  beforeEach(function() {

    angular.mock.module('linagora.esn.chat', function($provide) {
      chatParseMention = {
        parseMentions: function() {
          return $q.when();
        }
      };

      $translate = {
        instant: sinon.spy()
      };

      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatParseMention', chatParseMention);
      $provide.value('oembedImageFilterFilter', function() {});
      $provide.value('linkyFilter', function() {});
      $provide.value('esnEmoticonifyFilter', function() {});
      $provide.value('$translate', $translate);
    });

    angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
    });
  });

  function initController(message) {
    var controller = $controller('chatSystemMessageController',
      {$scope: $scope},
      {message: message}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {
    it('should translate system message', function() {
      var message = { text: '<%@123%> has joined the conversation' };
      var controller = initController(message);

      controller.$onInit();

      expect($translate.instant).to.have.been.calledWith('%s has joined the conversation', ['@123']);
    });
  });
});
