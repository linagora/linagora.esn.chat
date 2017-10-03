'use strict';

/* global sinon: false */

describe('The chatPrivateConversationService service', function() {
  var $q, $httpBackend, $rootScope, chatPrivateConversationService, sessionMock, user;

  beforeEach(function() {

    user = {
      _id: '_userId'
    };

    sessionMock = {
      user: user
    };
  });

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('esnCollaborationClientService', {});
      $provide.factory('session', function($q) {
        sessionMock.ready = $q.when({user: user});

        return sessionMock;
      });
    })
  );

  beforeEach(angular.mock.inject(function(_chatPrivateConversationService_, _$httpBackend_, _$rootScope_, _$q_) {
    chatPrivateConversationService = _chatPrivateConversationService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    sessionMock.ready = $q.when({user: user});
    sessionMock.user = user;
  }));

  describe('get function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/user/privateConversations').respond([]);

      chatPrivateConversationService.get();
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });
});
