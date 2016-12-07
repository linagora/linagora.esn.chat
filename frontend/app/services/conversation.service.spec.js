'use strict';

/* global sinon: false */

describe('The linagora.esn.chat conversation service', function() {
  var chatConversationService, $httpBackend, $rootScope;
  var id = '1';
  var user = '2';

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
    })
  );

  beforeEach(angular.mock.inject(function(_chatConversationService_, _$httpBackend_, _$rootScope_) {
    chatConversationService = _chatConversationService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  describe('fetchMessages function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/conversations/' + id + '/messages').respond([]);
      chatConversationService.fetchMessages(id);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('get function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/conversations/' + id).respond([]);
      chatConversationService.get(id);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('join function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectPUT('/chat/api/conversations/' + id + '/members/' + user).respond({});
      chatConversationService.join(id, user);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('leave function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectDELETE('/chat/api/conversations/' + id + '/members/' + user).respond({});
      chatConversationService.leave(id, user);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });
});
