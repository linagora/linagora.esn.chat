'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatUserMessageController controller', function() {

  var $rootScope, $scope, $q, $controller, sessionMock, oembedImageFilterMock, linkyMock, esnEmoticonifyMock, chatParseMentionMock, message, searchProvidersMock;

  beforeEach(function() {

    sessionMock = {
      _id: 'id',
      user: {
        _id: '_userId'
      },
      domain: {_id: 'domainId'}
    };

    chatParseMentionMock = {
      parseMentions: function(text) {
        return $q.when(text);
      }
    };

    oembedImageFilterMock = function() {
      return message.text;
    };

    linkyMock = function(text) {
      return text;
    };

    esnEmoticonifyMock = function(text) {
      return text;
    };

    searchProvidersMock = {
      add: sinon.spy()
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', searchProvidersMock);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.factory('session', function(_$q_) {

        sessionMock.ready = _$q_.when(sessionMock);

        return sessionMock;
      });
      $provide.value('chatParseMention', chatParseMentionMock);
      $provide.value('oembedImageFilterFilter', oembedImageFilterMock);
      $provide.value('linkyFilter', linkyMock);
      $provide.value('esnEmoticonifyFilter', esnEmoticonifyMock);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $q = _$q_;
    });
  });

  function initController(message) {
    var controller = $controller('chatUserMessageController',
      {$scope: $scope},
      {message: message}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should separate two mentions by a space', function() {

      message = {text: '@583c5a20ec0cfe01388fecab@583c5a20ec0cfe01388fecb0', user_mentions: [{}, {}]};
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.parsed.text).to.deep.equal('@583c5a20ec0cfe01388fecab @583c5a20ec0cfe01388fecb0');
    });

    it('should not separate mentions when there are no user mentions in the message ', function() {

      message = {text: '@ok@ok', user_mentions: [] };
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.parsed.text).to.deep.equal(message.text);
    });

    it('should separate mentions when mention is prefixed by a word', function() {

      message = {text: 'Hello@583c5a20ec0cfe01388fecab', user_mentions: [{}] };
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.parsed.text).to.deep.equal('Hello @583c5a20ec0cfe01388fecab');
    });

    it('should not separate mention when it is prefixed by a space', function() {

      message = {text: 'Hello @583c5a20ec0cfe01388fecab', user_mentions: [{}] };
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.parsed.text).to.deep.equal(message.text);
    });

    it('should separate only mention', function() {

      message = {text: 'Hello @583c5a20ec0cfe01388fecab@583c5a20ec0cfe01388fecb0 how are you?', user_mentions: [{}] };
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.parsed.text).to.deep.equal('Hello @583c5a20ec0cfe01388fecab @583c5a20ec0cfe01388fecb0 how are you?');
    });

  });

  describe('the toggle function', function() {

    it('should change starred value onclick ', function() {
      var controller = initController(message);

      controller.starred = false;

      controller.toggleStar();

      expect(controller.starred).to.be.true;
    });
  });
});
