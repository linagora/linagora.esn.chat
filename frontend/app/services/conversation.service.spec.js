'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversation service', function() {
  var chatConversationService, $httpBackend, $rootScope, collaborationAPIMock;
  var id = '1';
  var user = '2';

  beforeEach(function() {
    collaborationAPIMock = {
      join: sinon.spy(),
      leave: sinon.spy()
    };
  });

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('collaborationAPI', collaborationAPIMock);
      $provide.value('chatSearchConversationsProviderService', {});
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

  describe('fetchAttachments function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/conversations/' + id + '/attachments').respond([]);
      chatConversationService.fetchAttachments(id);
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
      chatConversationService.join(id, user);
      $rootScope.$digest();
      expect(collaborationAPIMock.join).to.have.been.calledWith('chat.conversation', id, user);
    });
  });

  describe('leave function', function() {
    it('should call the right endpoint', function() {
      chatConversationService.leave(id, user);
      $rootScope.$digest();
      expect(collaborationAPIMock.leave).to.have.been.calledWith('chat.conversation', id, user);
    });
  });
});
