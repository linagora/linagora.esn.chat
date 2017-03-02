'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageController controller', function() {

  var $q, $rootScope, $scope, $controller;
  var chatBotMessageService = {};
  var CHAT_MESSAGE_DISPLAYABLE_TYPES;

  beforeEach(function() {

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatBotMessageService', chatBotMessageService);
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });

    angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _chatBotMessageService_, _CHAT_MESSAGE_DISPLAYABLE_TYPES_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CHAT_MESSAGE_DISPLAYABLE_TYPES = _CHAT_MESSAGE_DISPLAYABLE_TYPES_;
    });
  });

  function initController(message) {
    var controller = $controller('chatBotMessageController',
      {$scope: $scope},
      {message: message}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should call chatBotMessageService resolve\'s method', function() {
      var message = {subtype: 'abc'};
      var controller = initController(message);

      chatBotMessageService.resolve = chatBotMessageService.resolve = sinon.stub().returns($q.when([]));

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.botUser.displayName).to.be.equal(CHAT_MESSAGE_DISPLAYABLE_TYPES.BOT);
      expect(chatBotMessageService.resolve).to.be.calledWith(message.subtype, message);
    });

    it('should call chatBotMessageService resolve\'s method', function(done) {
      var message = {subtype: 'abc'};
      var controller = initController(message);
      var text = 'text';

      chatBotMessageService.resolve = chatBotMessageService.resolve = sinon.stub().returns($q.when(text));

      controller.$onInit();

      chatBotMessageService
        .resolve(null, message)
        .then(function() {
          expect(controller.parsed.text).to.be.equal(text);

          done();
        });

        $rootScope.$digest();
    });

    it('should hide bot message on reject', function(done) {
      var message = {subtype: 'abc'};
      var controller = initController(message);
      var type = 'type';
      var error = 'An Error';

      chatBotMessageService.resolve = chatBotMessageService.resolve = sinon.stub().returns($q.reject(error));

      controller.$onInit();

      chatBotMessageService
        .resolve(type, message)
        .then(function() {
          done('should not resolve');
        })
        .catch(function(err) {
          expect(err).to.equal(error);
          expect(controller.hasBotError).to.equal(true);

          done();
        });

      $rootScope.$digest();
    });
  });
});
