'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversation service', function() {
  var chatConversationService, $httpBackend, $rootScope, ESNCollaborationClientServiceMock;
  var id = '1';
  var user = '2';

  beforeEach(function() {
    ESNCollaborationClientServiceMock = {
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
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('esnCollaborationClientService', ESNCollaborationClientServiceMock);
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

      expect(ESNCollaborationClientServiceMock.join).to.have.been.calledWith('chat.conversation', id, user);
    });
  });

  describe('leave function', function() {
    it('should call the right endpoint', function() {
      chatConversationService.leave(id, user);
      $rootScope.$digest();

      expect(ESNCollaborationClientServiceMock.leave).to.have.been.calledWith('chat.conversation', id, user);
    });
  });

  describe('markAsRead function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectPOST('/chat/api/conversations/' + id + '/readed').respond([]);

      chatConversationService.markAsRead(id);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('remove function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectDELETE('/chat/api/conversations/' + id).respond([]);

      chatConversationService.remove(id);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('update function', function() {
    it('should call the right endpoint', function() {
      var body = {foo: 'bar'};

      $httpBackend.expectPUT('/chat/api/conversations/' + id, body).respond([]);

      chatConversationService.update(id, body);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('updateTopic function', function() {
    it('should call the right endpoint', function() {
      var topic = 'My new topic';

      $httpBackend.expectPUT('/chat/api/conversations/' + id + '/topic', {value: topic}).respond([]);

      chatConversationService.updateTopic(id, topic);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('listForCurrentUser function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/user/conversations').respond([]);

      chatConversationService.listForCurrentUser();
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });
});
