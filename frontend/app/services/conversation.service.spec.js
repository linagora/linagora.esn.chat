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
      $provide.value('chatSearchProviderService', {});
      $provide.value('esnCollaborationClientService', ESNCollaborationClientServiceMock);
    })
  );

  beforeEach(angular.mock.inject(function(_chatConversationService_, _$httpBackend_, _$rootScope_) {
    chatConversationService = _chatConversationService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  describe('addMember function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectPUT('/chat/api/conversations/' + id + '/members/' + user).respond([]);

      chatConversationService.addMember(id, user);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('archive function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectPOST('/chat/api/conversations/' + id + '/archive').respond([]);

      chatConversationService.archive(id);
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

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

  describe('getSummary function', function() {
    it('should call the right endpoint', function() {
      $httpBackend.expectGET('/chat/api/conversations/' + id + '/summary').respond([]);

      chatConversationService.getSummary(id);
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

    it('should GET to right endpoint with provided options', function() {
      var options = {
        unread: true
      };

      $httpBackend.expectGET('/chat/api/user/conversations?unread=true').respond([]);

      chatConversationService.listForCurrentUser(options);

      $httpBackend.flush();
    });
  });

  describe('getStarredMessages function', function() {
    it('should call the right endpoint', function() {
      var options = {
        starred: true
      };

      $httpBackend.expectGET('/chat/api/messages?starred=true').respond([]);

      chatConversationService.getUserStarredMessages(options);

      $httpBackend.flush();
    });
  });
});
