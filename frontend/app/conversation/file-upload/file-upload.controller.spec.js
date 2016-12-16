'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatFileUploadController controller', function() {

  var $rootScope, $scope, $controller, $q, conversation, chatMessageService, chatLocalStateService, searchProviders, session, conversationId, userId;

  beforeEach(function() {

    conversationId = 1;
    userId = 2;

    conversation = {
      _id: conversationId
    };

    chatMessageService = {
      sendMessageWithAttachments: sinon.spy(function() {
        return $q.when();
      })
    };

    chatLocalStateService = {
      activeRoom: {_id: conversationId}
    };

    searchProviders = {
      add: sinon.spy()
    };

    session = {
      user: {
        _id: userId
      }
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatMessageService', chatMessageService);
      $provide.value('chatLocalStateService', chatLocalStateService);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('session', session);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $controller = _$controller_;
    });
  });

  function initController(conversation, joinCallback) {
    var controller = $controller('chatFileUploadController',
      {$scope: $scope},
      {conversation: conversation, onJoin: joinCallback}
    );

    $scope.$digest();

    return controller;
  }

  describe('the onFileSelect function', function() {
    var files = [];

    it('should send a message with attachments', function() {
      sinon.useFakeTimers(+new Date(2016, 4, 29));

      var messageObj = {
        channel: conversationId,
        creator: userId,
        date: Date.now(),
        text: ''
      };

      initController(conversation).onFileSelect(files);
      $rootScope.$digest();

      expect(chatMessageService.sendMessageWithAttachments).to.have.been.calledWith(messageObj, files);
    });
  });
});
