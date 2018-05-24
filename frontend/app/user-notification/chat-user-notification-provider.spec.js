'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The chatUserNotificationProvider', function() {
  var $rootScope, $q, sessionMock, esnUserNotificationCounterMock, user, today;
  var chatUserNotificationProvider, chatUserNotificationService, chatConversationService;

  beforeEach(function() {
    user = {
      _id: '_userId'
    };

    sessionMock = {
      user: user
    };

    esnUserNotificationCounterMock = {
      increaseBy: sinon.spy(),
      decreaseBy: sinon.spy(),
      refresh: sinon.spy()
    };

    today = new Date();
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('esnCollaborationClientService', {});
      $provide.value('esnUserNotificationService', { addProvider: angular.noop });
      $provide.value('esnUserNotificationCounter', esnUserNotificationCounterMock);
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
          expect(esnUserNotificationCounterMock.decreaseBy).to.have.been.calledWith(8);
          expect(esnUserNotificationCounterMock.refresh).to.have.been.called;

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
          expect(esnUserNotificationCounterMock.decreaseBy).to.have.been.calledWith(8);
          expect(esnUserNotificationCounterMock.refresh).to.have.been.called;

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
          expect(esnUserNotificationCounterMock.increaseBy).to.have.been.calledWith(1);
          expect(esnUserNotificationCounterMock.refresh).to.have.been.called;

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
      var conversation = { _id: id1, last_message: { date: newMessage.timestamps.creation } };

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
      expect(esnUserNotificationCounterMock.increaseBy).to.have.been.calledWith(1);
      expect(esnUserNotificationCounterMock.refresh).to.have.been.called;
      done();
    });
  });
});
