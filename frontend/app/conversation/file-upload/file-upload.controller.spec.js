'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatFileUploadController controller', function() {

  var $rootScope, $scope, $controller, $q, conversation, chatMessageService, chatConversationsStoreService,
    searchProviders, session, conversationId, userId, chatConversationMemberService, notificationFactory, esnConfig,
    MAX_SIZE_UPLOAD_DEFAULT;

  beforeEach(function() {

    conversationId = 1;
    userId = 2;

    notificationFactory = {
      weakError: sinon.spy()
    };

    chatConversationMemberService = {
      currentUserIsMemberOf: sinon.spy(function() {
        return true;
      })
    };

    conversation = {
      _id: conversationId
    };

    chatMessageService = {
      sendMessageWithAttachments: sinon.spy(function() {
        return $q.when();
      })
    };

    chatConversationsStoreService = {
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

    module('esn.configuration', function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when(104857600);
      });
    });
    module('esn.message');

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatMessageService', chatMessageService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('chatConversationMemberService', chatConversationMemberService);
      $provide.value('chatSearchProviderService', {});
      $provide.value('session', session);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _esnConfig_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $controller = _$controller_;
      esnConfig = _esnConfig_;
    });
  });

  function initController(conversation, joinCallback) {
    var controller = $controller('chatFileUploadController',
      {$scope: $scope, esnConfig: esnConfig, MAX_SIZE_UPLOAD_DEFAULT: MAX_SIZE_UPLOAD_DEFAULT},
      {conversation: conversation, onJoin: joinCallback}
    );

    $scope.$digest();

    return controller;
  }

  describe('the onFileSelect function', function() {
    var files = [{_id: 1}];

    it('should do nothing when files is undefined', function() {
      initController(conversation).onFileSelect();
      $rootScope.$digest();

      expect(chatConversationMemberService.currentUserIsMemberOf).to.not.have.been.called;
      expect(chatMessageService.sendMessageWithAttachments).to.not.have.been.called;
    });

    it('should do nothing when files array is empty', function() {
      initController(conversation).onFileSelect([]);
      $rootScope.$digest();

      expect(chatConversationMemberService.currentUserIsMemberOf).to.not.have.been.called;
      expect(chatMessageService.sendMessageWithAttachments).to.not.have.been.called;
    });

    it('should show error and not upload when user is not member', function() {
      chatConversationMemberService.currentUserIsMemberOf = sinon.spy(function() {
        return false;
      });

      initController(conversation).onFileSelect([files]);
      $rootScope.$digest();

      expect(chatConversationMemberService.currentUserIsMemberOf).to.have.been.calledWith(chatConversationsStoreService.activeRoom);
      expect(chatMessageService.sendMessageWithAttachments).to.not.have.been.called;
      expect(notificationFactory.weakError).to.have.been.calledWith('error', 'You can not upload files without being a member');
    });

    it('should send a message with attachments', function(done) {
      var clock = sinon.useFakeTimers(+new Date(2016, 4, 29));
      var messageObj = {
        channel: conversationId,
        creator: userId,
        date: Date.now(),
        text: ''
      };

      var promise = initController(conversation).onFileSelect(files);

      promise.then(function() {
        expect(chatMessageService.sendMessageWithAttachments).to.have.been.calledWith(messageObj, files);

        clock.restore();
        done();
      });

      $rootScope.$digest();
    });
  });
});
