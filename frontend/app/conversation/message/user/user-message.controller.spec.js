'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatUserMessageController controller', function() {

  var $rootScope, $scope, $q, $controller, $log, sessionMock, oembedImageFilterMock, linkyMock, esnEmoticonifyMock, chatParseMentionMock, message, searchProvidersMock, chatMessageStarServiceMock, userUtilsMock;

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

    chatMessageStarServiceMock = {
      unstar: sinon.spy(function() {
        return $q.when();
      }),
      star: sinon.spy(function() {
        return $q.when();
      })
    };

    userUtilsMock = {
      displayNameOf: sinon.spy()
    };

    $log = {
      error: sinon.spy()
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
      $provide.value('chatMessageStarService', chatMessageStarServiceMock);
      $provide.value('userUtils', userUtilsMock);
      $provide.value('$log', $log);
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

    it('should call userUtils.displayNameOf', function() {
      message = {text: 'Hello', user_mentions: [{}], creator: {firstname: 'John1', lastname: 'Doe1'}};
      var controller = initController(message);

      controller.$onInit();
      $rootScope.$digest();

      expect(userUtilsMock.displayNameOf).to.be.calledWith(message.creator);
    });
  });

  describe('the toggle function', function() {

    it('should call chatMessageStarService.unstar is the message is starred', function() {
      message.isStarred = true;
      var controller = initController(message);

      controller.toggleStar();
      $rootScope.$digest();

      expect(chatMessageStarServiceMock.unstar).to.be.calledWith(message._id);
      expect(chatMessageStarServiceMock.star).to.not.have.been.called;
      expect(message.isStarred).to.be.false;
    });

    it('should call chatMessageStarService.star is the message is unstarred', function() {
      message.isStarred = false;
      var controller = initController(message);

      controller.toggleStar();
      $rootScope.$digest();

      expect(chatMessageStarServiceMock.star).to.be.calledWith(message._id);
      expect(chatMessageStarServiceMock.unstar).to.not.have.been.called;
      expect(message.isStarred).to.be.true;
    });

    it('should not update the isStarred flag', function() {
      message.isStarred = true;
      var controller = initController(message);

      chatMessageStarServiceMock.unstar = sinon.spy(function() {
        return $q.reject();
      });

      controller.toggleStar();
      $rootScope.$digest();

      expect(chatMessageStarServiceMock.star).to.not.have.been.called;
      expect(message.isStarred).to.be.true;
      expect($log.error).to.have.been.called;
      expect($log.error).to.have.been.calledWith('Error while toggling star of message');
    });
  });
});
