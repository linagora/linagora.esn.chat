'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The chatUserNotificationService service', function() {
  var $rootScope, $q, sessionMock, user, category, chatConversationService, chatUserNotificationService;

  beforeEach(function() {
    user = {
      _id: '_userId'
    };
    category = 'chat:unread';

    sessionMock = {
      user: user
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('esnCollaborationClientService', {});
      $provide.value('esnUserNotificationService', { addProvider: angular.noop });
      $provide.value('esnUserNotificationCounter', {});
      $provide.value('esnUserNotificationTemplateProviderRegistry', { add: angular.noop });
      $provide.value('ChatUserNotification', function(data) {
        return data;
      });
      $provide.factory('session', function($q) {
        sessionMock.ready = $q.when({ user: user });

        return sessionMock;
      });
    });
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _$q_,
      _chatConversationService_,
      _ChatUserNotification_,
      _chatUserNotificationService_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      chatConversationService = _chatConversationService_;
      chatUserNotificationService = _chatUserNotificationService_;
    });
  });

  describe('The get function', function() {
    it('should build empty notification object if there are no unread messages', function(done) {
      chatConversationService.fetchUnreadOpenAndSubscribedConversations = sinon.stub().returns($q.when([]));
      chatUserNotificationService.get()
        .then(function(chatUserNotification) {
          expect(chatConversationService.fetchUnreadOpenAndSubscribedConversations).to.have.been.called;
          expect(chatUserNotification).to.deep.equal({
            category: category,
            read: true,
            numberOfUnreadMessages: 0,
            numberOfUnseenMentions: 0,
            unreadConversations: []
          });
          done();
        });

      $rootScope.$digest();
    });

    it('should build notification object if there are unread messages', function(done) {
      var today = new Date();
      var unreadConversation1 = {
        _id: 'id1',
        numOfMessage: 2,
        memberStates: {
          _userId: { numOfReadMessages: 1 }
        },
        last_message: {
          date: today - 2
        },
        unreadMessageCount: 1
      };
      var unreadConversation2 = {
        _id: 'id2',
        numOfMessage: 4,
        memberStates: {
          _userId: { numOfReadMessages: 2 }
        },
        last_message: {
          date: today - 1
        },
        unreadMessageCount: 2
      };

      chatConversationService.fetchUnreadOpenAndSubscribedConversations = sinon.stub().returns($q.when([unreadConversation1, unreadConversation2]));
      chatUserNotificationService.get()
        .then(function(chatUserNotification) {
          expect(chatConversationService.fetchUnreadOpenAndSubscribedConversations).to.have.been.called;
          expect(chatUserNotification).to.deep.equal({
            category: category,
            read: false,
            numberOfUnreadMessages: 3,
            numberOfUnseenMentions: 0,
            unreadConversations: [
              {
                _id: unreadConversation2._id,
                numberOfUnreadMessages: 2,
                last_message: unreadConversation2.last_message,
                numberOfUnseenMentions: 0
              },
              {
                _id: unreadConversation1._id,
                numberOfUnreadMessages: 1,
                last_message: unreadConversation1.last_message,
                numberOfUnseenMentions: 0
              }
            ],
            lastUnreadConversationId: unreadConversation2._id,
            timestamps: {
              creation: unreadConversation2.last_message.date
            }
          });
          done();
        });

      $rootScope.$digest();
    });

    it('should build notification object if there are unread messages with mentions', function(done) {
      var unreadConversation = {
        _id: 'id',
        numOfMessage: 2,
        memberStates: {
          _userId: { numOfReadMessages: 1, numOfUnseenMentions: 1 }
        },
        last_message: {
          date: new Date()
        },
        unreadMessageCount: 1
      };

      chatConversationService.fetchUnreadOpenAndSubscribedConversations = sinon.stub().returns($q.when([unreadConversation]));

      chatUserNotificationService.get()
        .then(function(chatUserNotification) {
          expect(chatConversationService.fetchUnreadOpenAndSubscribedConversations).to.have.been.called;
          expect(chatUserNotification).to.deep.equal({
            category: category,
            read: false,
            numberOfUnreadMessages: 1,
            numberOfUnseenMentions: 1,
            unreadConversations: [
              {
                _id: unreadConversation._id,
                numberOfUnreadMessages: 1,
                last_message: unreadConversation.last_message,
                numberOfUnseenMentions: 1
              }
            ],
            lastUnreadConversationId: unreadConversation._id,
            timestamps: {
              creation: unreadConversation.last_message.date
            }
          });
          done();
        });

      $rootScope.$digest();
    });
  });
});
