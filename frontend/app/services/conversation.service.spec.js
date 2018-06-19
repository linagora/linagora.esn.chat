'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversation service', function() {
  var $q, chatConversationService, chatPrivateConversationService, $httpBackend, $rootScope, ESNCollaborationClientServiceMock;
  var CHAT_CONVERSATION_TYPE;
  var id = 'userId';
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
      $provide.factory('session', function($q) {
        return {
          ready: $q.when({ user: user }),
          user: {
            id: id,
            _id: id
          }
        };
      });
    })
  );

  beforeEach(angular.mock.inject(function(_$q_, _$httpBackend_, _$rootScope_, _chatConversationService_, _chatPrivateConversationService_, _CHAT_CONVERSATION_TYPE_) {
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    chatConversationService = _chatConversationService_;
    chatPrivateConversationService = _chatPrivateConversationService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
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

  describe('The fetchOpenAndSubscribedConversations function', function() {
    it('should fetch all open and subscribed private conversations that user is a member of and calculate the unread message', function(done) {
      var openConversations, subscribedPrivateConversations;

      openConversations = [
        {
          _id: 1,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 10,
          memberStates: {
            userId: {
              numOfReadMessages: 8
            }
          }
        },
        {
          _id: 2,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 10,
          memberStates: {
            userId: {
              numOfUnseenMentions: 4
            }
          }
        },
        {
          _id: 3,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 15,
          memberStates: {}
        },
        {
          _id: 4,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 13
        }
      ];

      subscribedPrivateConversations = [
        {
          _id: 5,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 10,
          memberStates: {
            userId: {
              numOfReadMessages: 8
            }
          }
        },
        {
          _id: 6,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 12,
          memberStates: {
            userId: {
              numOfUnseenMentions: 4
            }
          }
        },
        {
          _id: 7,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 15,
          memberStates: {}
        },
        {
          _id: 8,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 14
        }
      ];

      $httpBackend.expectGET('/chat/api/user/conversations').respond(openConversations);
      chatPrivateConversationService.get = sinon.stub().returns($q.when(subscribedPrivateConversations));

      chatConversationService.fetchOpenAndSubscribedConversations().then(function(conversations) {
        expect(conversations).to.shallowDeepEqual([
          {
            _id: 1,
            type: CHAT_CONVERSATION_TYPE.OPEN,
            numOfMessage: 10,
            memberStates: {
              userId: {
                numOfReadMessages: 8
              }
            },
            unreadMessageCount: 2
          },
          {
            _id: 2,
            type: CHAT_CONVERSATION_TYPE.OPEN,
            numOfMessage: 10,
            memberStates: {
              userId: {
                numOfUnseenMentions: 4
              }
            },
            unreadMessageCount: 10
          },
          {
            _id: 3,
            type: CHAT_CONVERSATION_TYPE.OPEN,
            numOfMessage: 15,
            memberStates: {},
            unreadMessageCount: 15
          },
          {
            _id: 4,
            type: CHAT_CONVERSATION_TYPE.OPEN,
            numOfMessage: 13,
            unreadMessageCount: 13
          },
          {
            _id: 5,
            type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
            numOfMessage: 10,
            memberStates: {
              userId: {
                numOfReadMessages: 8
              }
            },
            unreadMessageCount: 2
          },
          {
            _id: 6,
            type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
            numOfMessage: 12,
            memberStates: {
              userId: {
                numOfUnseenMentions: 4
              }
            },
            unreadMessageCount: 12
          },
          {
            _id: 7,
            type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
            numOfMessage: 15,
            memberStates: {},
            unreadMessageCount: 15
          },
          {
            _id: 8,
            type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
            numOfMessage: 14,
            unreadMessageCount: 14
          }
        ]);
        done();
      });

      $rootScope.$digest();
      $httpBackend.flush();
    });
  });

  describe('The fetchUnreadOpenAndSubscribedConversations function', function() {
    it('should return only unread open and subscribed private conversations', function(done) {
      var openConversations = [
        {
          _id: 1,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 10,
          memberStates: {
            userId: {
              numOfReadMessages: 8
            }
          },
          unreadMessageCount: 2
        },
        {
          _id: 3,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 10,
          memberStates: {
            userId: {
              numOfReadMessages: 10
            }
          },
          unreadMessageCount: 0
        }
      ];

      var subscribedPrivateConversations = [
        {
          _id: 2,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 12,
          memberStates: {
            userId: {
              numOfReadMessages: 8
            }
          },
          unreadMessageCount: 4
        },
        {
          _id: 4,
          type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
          numOfMessage: 14,
          memberStates: {
            userId: {
              numOfReadMessages: 14
            }
          },
          unreadMessageCount: 0
        }
      ];

      $httpBackend.expectGET('/chat/api/user/conversations').respond(openConversations);
      chatPrivateConversationService.get = sinon.stub().returns($q.when(subscribedPrivateConversations));

      chatConversationService.fetchUnreadOpenAndSubscribedConversations().then(function(unreadOpenAndSubscribedConversations) {
        expect(unreadOpenAndSubscribedConversations).to.shallowDeepEqual([
          {
            _id: 1,
            type: CHAT_CONVERSATION_TYPE.OPEN,
            numOfMessage: 10,
            memberStates: {
              userId: {
                numOfReadMessages: 8
              }
            },
            unreadMessageCount: 2
          },
          {
            _id: 2,
            type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE,
            numOfMessage: 12,
            memberStates: {
              userId: {
                numOfReadMessages: 8
              }
            },
            unreadMessageCount: 4
          }
        ]);
        done();
      });

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
