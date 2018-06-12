'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The chatUserNotificationProvider', function() {
  var $rootScope, $q, sessionMock, esnUserNotificationStateMock, user, today;
  var chatUserNotificationProvider, chatUserNotificationService, chatConversationService;

  beforeEach(function() {
    user = {
      _id: '_userId'
    };

    sessionMock = {
      user: user
    };

    esnUserNotificationStateMock = {
      increaseCountBy: sinon.spy(),
      decreaseCountBy: sinon.spy(),
      increaseNumberOfImportantNotificationsBy: sinon.spy(),
      decreaseNumberOfImportantNotificationsBy: sinon.spy(),
      refresh: sinon.spy()
    };

    today = new Date();
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('esnCollaborationClientService', {});
      $provide.value('esnUserNotificationService', { addProvider: angular.noop });
      $provide.value('esnUserNotificationState', esnUserNotificationStateMock);
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
      _chatUserNotificationService_,
      _chatUserNotificationProvider_,
      _chatConversationService_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      chatUserNotificationService = _chatUserNotificationService_;
      chatConversationService = _chatConversationService_;
      chatUserNotificationProvider = _chatUserNotificationProvider_;
    });
  });

  describe('The getUnreadCount function', function() {
    it('should return number of unread messages', function(done) {
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          expect(chatUserNotificationService.get).to.have.been.calledOnce;

          chatUserNotificationProvider.getUnreadCount()
            .then(function(unreadCount) {
              expect(chatUserNotificationService.get).to.have.been.calledOnce;
              expect(unreadCount).to.equal(notification.numberOfUnreadMessages);

              done();
            });
        });

      $rootScope.$digest();
    });
  });

  describe('The getNumberOfImportantNotifications function', function() {
    it('should return number of unseen mentions', function(done) {
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnseenMentions: 10
      };

      chatUserNotificationService.get = function() {
        return $q.when(notification);
      };
      chatUserNotificationProvider.getNumberOfImportantNotifications()
        .then(function(numberOfUnseenMentions) {
          expect(numberOfUnseenMentions).to.equal(notification.numberOfUnseenMentions);
          done();
        });

      $rootScope.$digest();
    });
  });

  describe('The list function', function() {
    it('should return one notification', function(done) {
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      var options = { offset: 0, limit: 1 };

      chatUserNotificationProvider.list(options)
        .then(function() {
          expect(chatUserNotificationService.get).to.have.been.calledOnce;

          chatUserNotificationProvider.list(options)
            .then(function(response) {
              expect(chatUserNotificationService.get).to.have.been.calledOnce;
              expect(response.data).to.deep.equal([notification]);

              done();
            });
        });

      $rootScope.$digest();
    });
  });

  describe('The updateOnConversationRead function', function() {
    it('should do nothing if there is a read notification', function(done) {
      var notification = {
        category: 'chat:unread',
        read: true,
        numberOfUnreadMessages: 0,
        numberOfUnseenMentions: 0,
        unreadConversations: []
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          chatUserNotificationProvider.updateOnConversationRead();

          expect(notification).to.shallowDeepEqual({
            read: true,
            numberOfUnreadMessages: 0,
            numberOfUnseenMentions: 0
          });
          expect(esnUserNotificationStateMock.decreaseCountBy).to.not.have.been.called;
          expect(esnUserNotificationStateMock.decreaseNumberOfImportantNotificationsBy).to.not.have.been.called;
          expect(esnUserNotificationStateMock.refresh).to.not.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should do nothing if conversation has no unread message', function(done) {
      var unreadConversationId = 'unreadConversationId';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 1,
        unreadConversations: [
          { _id: unreadConversationId, numberOfUnreadMessages: 1, last_message: { date: today - 1 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: unreadConversationId
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          chatUserNotificationProvider.updateOnConversationRead('123');

          expect(notification).to.deep.equal({
            category: 'chat:unread',
            read: false,
            numberOfUnreadMessages: 1,
            unreadConversations: [
              { _id: unreadConversationId, numberOfUnreadMessages: 1, last_message: { date: today - 1 } }
            ],
            timestamps: {
              creation: today - 1
            },
            lastUnreadConversationId: unreadConversationId
          });
          expect(esnUserNotificationStateMock.decreaseCountBy).to.not.have.been.called;
          expect(esnUserNotificationStateMock.decreaseNumberOfImportantNotificationsBy).to.not.have.been.called;
          expect(esnUserNotificationStateMock.refresh).to.not.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should decrease the number of unread messages', function(done) {
      var id1 = 'id1';
      var id2 = 'id2';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10,
        unreadConversations: [
          { _id: id1, numberOfUnreadMessages: 8, last_message: { date: today - 1 } },
          { _id: id2, numberOfUnreadMessages: 2, last_message: { date: today - 2 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: id1
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          chatUserNotificationProvider.updateOnConversationRead(id1);

          expect(notification).to.shallowDeepEqual({
            read: false,
            numberOfUnreadMessages: 2,
            timestamps: {
              creation: today - 2
            },
            lastUnreadConversationId: id2
          });
          expect(esnUserNotificationStateMock.decreaseCountBy).to.have.been.calledWith(8);
          expect(esnUserNotificationStateMock.refresh).to.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should decrease the number of unseen mentions if user is mentioned in unread messages', function(done) {
      var id1 = 'id1';
      var id2 = 'id2';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10,
        numberOfUnseenMentions: 6,
        unreadConversations: [
          { _id: id1, numberOfUnreadMessages: 8, numberOfUnseenMentions: 5, last_message: { date: today - 1 } },
          { _id: id2, numberOfUnreadMessages: 2, numberOfUnseenMentions: 1, last_message: { date: today - 2 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: id1
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getNumberOfImportantNotifications()
        .then(function(numberOfUnseenMentions) {
          expect(numberOfUnseenMentions).to.equal(6);

          chatUserNotificationProvider.updateOnConversationRead(id1);

          expect(notification).to.shallowDeepEqual({
            read: false,
            numberOfUnreadMessages: 2,
            numberOfUnseenMentions: 1,
            timestamps: {
              creation: today - 2
            },
            lastUnreadConversationId: id2
          });
          expect(esnUserNotificationStateMock.decreaseNumberOfImportantNotificationsBy).to.have.been.calledWith(5);
          expect(esnUserNotificationStateMock.refresh).to.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should set "read" to true if user has read all messages', function(done) {
      var id1 = 'id1';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 8,
        unreadConversations: [
          { _id: id1, numberOfUnreadMessages: 8, last_message: { date: today - 1 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: id1
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          chatUserNotificationProvider.updateOnConversationRead(id1);

          expect(notification).to.shallowDeepEqual({
            read: true,
            numberOfUnreadMessages: 0
          });
          expect(esnUserNotificationStateMock.decreaseCountBy).to.have.been.calledWith(8);
          expect(esnUserNotificationStateMock.refresh).to.have.been.called;

          done();
        });

      $rootScope.$digest();
    });
  });

  describe('The updateOnNewMessageReceived function', function() {
    it('should increase the number of unread messages if there is one new message in unread conversation', function(done) {
      var id1 = 'id1';
      var id2 = 'id2';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10,
        unreadConversations: [
          { _id: id1, numberOfUnreadMessages: 8, last_message: { date: today - 1 } },
          { _id: id2, numberOfUnreadMessages: 2, last_message: { date: today - 2 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: id1
      };
      var newMessage = { channel: id1, timestamps: { creation: today - 3 } };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getUnreadCount()
        .then(function() {
          chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);

          expect(notification).to.shallowDeepEqual({
            numberOfUnreadMessages: 11,
            timestamps: {
              creation: newMessage.timestamps.creation
            },
            lastUnreadConversationId: newMessage.channel
          });
          expect(esnUserNotificationStateMock.increaseCountBy).to.have.been.calledWith(1);
          expect(esnUserNotificationStateMock.refresh).to.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should increase the number of unseen mentions if there is one new message in unread conversation', function(done) {
      var id1 = 'id1';
      var id2 = 'id2';
      var notification = {
        category: 'chat:unread',
        read: false,
        numberOfUnreadMessages: 10,
        numberOfUnseenMentions: 6,
        unreadConversations: [
          { _id: id1, numberOfUnreadMessages: 8, numberOfUnseenMentions: 5, last_message: { date: today - 1 } },
          { _id: id2, numberOfUnreadMessages: 2, numberOfUnseenMentions: 1, last_message: { date: today - 2 } }
        ],
        timestamps: {
          creation: today - 1
        },
        lastUnreadConversationId: id1
      };
      var newMessage = {
        channel: id1,
        timestamps: { creation: today - 3 },
        user_mentions: [{ _id: user._id }]
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatUserNotificationProvider.getNumberOfImportantNotifications()
        .then(function(numberOfUnseenMentions) {
          expect(numberOfUnseenMentions).to.equal(6);

          chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);

          expect(notification).to.shallowDeepEqual({
            unreadConversations: [{
              _id: id1,
              numberOfUnseenMentions: 6
            }],
            numberOfUnseenMentions: 7,
            timestamps: {
              creation: newMessage.timestamps.creation
            },
            lastUnreadConversationId: newMessage.channel
          });
          expect(esnUserNotificationStateMock.increaseNumberOfImportantNotificationsBy).to.have.been.calledWith(1);
          expect(esnUserNotificationStateMock.refresh).to.have.been.called;

          done();
        });

      $rootScope.$digest();
    });

    it('should increase the number of unread messages if there is one new message in already read conversation', function(done) {
      var id1 = 'id1';
      var notification = {
        category: 'chat:unread',
        read: true,
        numberOfUnreadMessages: 0,
        unreadConversations: []
      };
      var newMessage = { channel: id1, timestamps: { creation: today - 3 } };
      var conversation = {
        _id: id1,
        member_status: 'member',
        last_message: { date: newMessage.timestamps.creation }
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatConversationService.get = sinon.stub().returns($q.when(conversation));

      chatUserNotificationProvider.getUnreadCount();
      $rootScope.$digest();
      chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);
      $rootScope.$digest();

      expect(notification).to.shallowDeepEqual({
        read: false,
        numberOfUnreadMessages: 1,
        timestamps: {
          creation: newMessage.timestamps.creation
        },
        lastUnreadConversationId: newMessage.channel,
        unreadConversations: [
          { _id: conversation._id, numberOfUnreadMessages: 1, last_message: conversation.last_message}
        ]
      });
      expect(esnUserNotificationStateMock.increaseCountBy).to.have.been.calledWith(1);
      expect(esnUserNotificationStateMock.refresh).to.have.been.called;
      done();
    });

    it('should not increase the number of unread messages if there is one new message in conversation that user is not a member of', function(done) {
      var id1 = 'id1';
      var notification = {
        category: 'chat:unread',
        read: true,
        numberOfUnreadMessages: 0,
        unreadConversations: []
      };
      var newMessage = {
        channel: id1,
        timestamps: { creation: today - 3 }
      };
      var conversation = {
        _id: id1,
        member_status: 'none',
        last_message: { date: newMessage.timestamps.creation }
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatConversationService.get = sinon.stub().returns($q.when(conversation));

      chatUserNotificationProvider.getUnreadCount();
      $rootScope.$digest();
      chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);
      $rootScope.$digest();

      expect(notification).to.shallowDeepEqual({
        read: true,
        numberOfUnreadMessages: 0,
        unreadConversations: []
      });
      expect(esnUserNotificationStateMock.increaseCountBy).to.not.have.been.called;
      expect(esnUserNotificationStateMock.refresh).to.not.have.been.called;
      done();
    });

    it('should increase the number of unseen mentions if there is one new message in already read conversation', function(done) {
      var id1 = 'id1';
      var notification = {
        category: 'chat:unread',
        read: true,
        numberOfUnreadMessages: 0,
        numberOfUnseenMentions: 0,
        unreadConversations: []
      };
      var newMessage = {
        channel: id1,
        timestamps: { creation: today - 3 },
        user_mentions: [{ _id: user._id }]
      };
      var conversation = {
        _id: id1,
        member_status: 'member',
        last_message: { date: newMessage.timestamps.creation }
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatConversationService.get = sinon.stub().returns($q.when(conversation));

      chatUserNotificationProvider.getNumberOfImportantNotifications();
      $rootScope.$digest();
      chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);
      $rootScope.$digest();

      expect(notification).to.shallowDeepEqual({
        read: false,
        numberOfUnreadMessages: 1,
        numberOfUnseenMentions: 1,
        timestamps: {
          creation: newMessage.timestamps.creation
        },
        lastUnreadConversationId: newMessage.channel,
        unreadConversations: [
          {
            _id: conversation._id,
            numberOfUnreadMessages: 1,
            numberOfUnseenMentions: 1,
            last_message: conversation.last_message
          }
        ]
      });
      expect(esnUserNotificationStateMock.increaseNumberOfImportantNotificationsBy).to.have.been.calledWith(1);
      expect(esnUserNotificationStateMock.refresh).to.have.been.called;
      done();
    });

    it('should not increase the number of unseen mentions if there is one new message in conversation that user is not a member of', function(done) {
      var id1 = 'id1';
      var notification = {
        category: 'chat:unread',
        read: true,
        numberOfUnreadMessages: 0,
        numberOfUnseenMentions: 0,
        unreadConversations: []
      };
      var newMessage = {
        channel: id1,
        timestamps: { creation: today - 3 },
        user_mentions: [{ _id: user._id }]
      };
      var conversation = {
        _id: id1,
        member_status: 'none',
        last_message: { date: newMessage.timestamps.creation }
      };

      chatUserNotificationService.get = sinon.stub().returns($q.when(notification));
      chatConversationService.get = sinon.stub().returns($q.when(conversation));

      chatUserNotificationProvider.getUnreadCount();
      $rootScope.$digest();
      chatUserNotificationProvider.updateOnNewMessageReceived(newMessage);
      $rootScope.$digest();

      expect(notification).to.shallowDeepEqual({
        read: true,
        numberOfUnseenMentions: 0,
        unreadConversations: []
      });
      expect(esnUserNotificationStateMock.increaseNumberOfImportantNotificationsBy).to.not.have.been.called;
      expect(esnUserNotificationStateMock.refresh).to.not.have.been.called;
      done();
    });
  });
});
