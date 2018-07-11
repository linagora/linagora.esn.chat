'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationActionsService service', function() {

  var $log, $q, privateConversation, conversation, name, user, result, sessionMock, chatPrivateConversationService, chatConversationActionsService, chatMessageUtilsService, chatConversationNameService, chatConversationService, chatConversationsStoreService, chatDesktopNotificationService, $rootScope;
  var CHAT_CONVERSATION_TYPE, CHAT_CONVERSATION_MODE, CHAT_EVENTS;
  var error, successSpy, errorSpy;

  beforeEach(function() {
    name = 'default';
    error = new Error('I failed');
    successSpy = sinon.spy();
    errorSpy = sinon.spy();
    conversation = {_id: 1, name: 'My conversation'};
    privateConversation = {
      _id: 2,
      name: 'My private conversation',
      numOfMessage: 15,
      memberStates: {}
    };
    user = {
      _id: 'userId',
      id: 'userId'
    };
    privateConversation.memberStates[user.id] = {
      numOfReadMessages: 10
    };
    result = {data: {foo: 'bar'}};
    sessionMock = {
      ready: null
    };
    chatDesktopNotificationService = {
      notify: sinon.spy()
    };
    chatPrivateConversationService = {
      get: sinon.spy(function() {
        return $q.when(privateConversation);
      })
    };
    chatMessageUtilsService = {};
    chatConversationsStoreService = {};
    chatConversationNameService = {
      getName: sinon.spy(function() {
        return $q.when(name);
      })
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: angular.noop
      });
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatConversationNameService', chatConversationNameService);
      $provide.value('chatDesktopNotificationService', chatDesktopNotificationService);
      $provide.value('chatMessageUtilsService', chatMessageUtilsService);
      $provide.value('chatPrivateConversationService', chatPrivateConversationService);
      $provide.value('esnCollaborationClientService', {
        join: sinon.spy(),
        leave: sinon.spy()
      });
      $provide.factory('session', function($q) {
        sessionMock.ready = $q.when({user: user});

        return sessionMock;
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$log_, _$q_, _chatConversationService_, _chatConversationActionsService_, _$rootScope_, _CHAT_CONVERSATION_TYPE_, _CHAT_CONVERSATION_MODE_, _CHAT_EVENTS_) {
    $log = _$log_;
    $q = _$q_;
    chatConversationActionsService = _chatConversationActionsService_;
    chatConversationService = _chatConversationService_;
    $rootScope = _$rootScope_;
    sessionMock.ready = $q.when({user: user});
    sessionMock.user = user;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    CHAT_CONVERSATION_MODE = _CHAT_CONVERSATION_MODE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  describe('The addConversation function', function() {
    it('should reject when conversation is undefined', function() {
      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.addConversation().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/Can not add empty conversation/);
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
    });

    it('should reject when name can not be resolved', function() {
      var error = new Error('I failed');

      chatConversationsStoreService.addConversation = sinon.spy();
      chatConversationNameService.getName = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationActionsService.addConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.equal(error.message);
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
    });

    it('should add the conversation to the store', function() {
      chatConversationsStoreService.addConversation = sinon.spy();
      chatConversationActionsService.addConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(chatConversationsStoreService.addConversation).to.have.been.called;
      expect(chatConversationsStoreService.addConversation.firstCall.args[0].name).to.equal(name);
    });
  });

  describe('The addConversationWhenCreatorOrConfidential function', function() {

    it('should reject when conversation is undefined', function() {
      chatConversationActionsService.addConversationWhenCreatorOrConfidential().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/Can not add empty conversation/);
    });

    it('should not add the public conversation to the store if user is not the creator', function() {
      var aPublicConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.OPEN, creator: { _id: 'userId1' }};

      chatConversationsStoreService.addConversation = sinon.spy();
      chatConversationActionsService.addConversationWhenCreatorOrConfidential(aPublicConversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationNameService.getName).to.not.have.been.called;
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/Can not add such conversation/);
    });

    it('should add the open conversation to the store if current user is the creator', function() {
      var aPublicConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.OPEN, creator: { _id: user._id }};

      chatConversationsStoreService.addConversation = sinon.spy();
      chatConversationActionsService.addConversationWhenCreatorOrConfidential(aPublicConversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationNameService.getName).to.have.been.called;
      expect(chatConversationsStoreService.addConversation).to.have.been.called;
      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(successSpy.firstCall.args[0].name).to.equal(name);
    });

    it('should add the confidential conversation to the store even if not creator', function() {
      var aConfidentialConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE, creator: { _id: 'userId1' }};

      chatConversationsStoreService.addConversation = sinon.spy();
      chatConversationActionsService.addConversationWhenCreatorOrConfidential(aConfidentialConversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationNameService.getName).to.have.been.called;
      expect(chatConversationsStoreService.addConversation).to.have.been.called;
      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(successSpy.firstCall.args[0].name).to.equal(name);
    });
  });

  describe('The addMember function', function() {
    it('should reject when conversation is undefined', function() {
      chatConversationService.addMember = sinon.spy();
      chatConversationActionsService.addMember().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/Can not add empty conversation/);
      expect(chatConversationService.addMember).to.not.have.been.called;
    });

    it.skip('should call the chatConversationService addMember function', function() {
      var userId = 'userId';

      chatConversationService.addMember = sinon.spy();
      chatConversationActionsService.addMember(conversation, userId).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(chatConversationService.addMember).to.have.been.calledWith(conversation, userId);
    });
  });

  describe('The archiveConversation function', function() {

    it('should reject when conversationId is undefined', function() {
      chatConversationsStoreService.deleteConversation = sinon.spy();
      chatConversationService.archive = sinon.spy();
      chatConversationActionsService.archiveConversation().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/conversationId is required/);
      expect(chatConversationService.archive).to.not.have.been.called;
    });

    it('should reject when chatConversationService.archive returns false', function() {
      var conversationId = 'id';

      chatConversationsStoreService.deleteConversation = sinon.spy();
      chatConversationService.archive = sinon.spy(function() {
        return $q.when(false);
      });
      chatConversationActionsService.archiveConversation(conversationId).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/could not archive the conversation/);
      expect(chatConversationService.archive).to.have.been.called;
      expect(chatConversationsStoreService.deleteConversation).to.not.have.been.called;
    });

    it('should call the chatConversationService.archive then delete the channel from the store ', function() {
      var conversationId = 'id';

      chatConversationsStoreService.deleteConversation = sinon.spy();
      chatConversationService.archive = sinon.spy(function() {
        return $q.when(true);
      });
      chatConversationActionsService.archiveConversation(conversationId).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(chatConversationService.archive).to.have.been.calledWith(conversationId);
      expect(chatConversationsStoreService.deleteConversation).to.have.been.called;
    });
  });

  describe('The createOpenConversation function', function() {
    it('should call chatConversationService.create and save new channel in store', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createOpenConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.OPEN, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(result.data);
    });

    it('should reject when chatConversationService.create rejects', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createOpenConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.OPEN, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The createDirectmessageConversation function', function() {
    it('should call chatConversationService.create and save new channel in store', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createDirectmessageConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(result.data);
    });

    it('should reject when chatConversationService.create rejects', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createDirectmessageConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The createConfidentialConversation function', function() {
    it('should call chatConversationService.create and save new channel in store', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createConfidentialConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(result.data);
    });

    it('should reject when chatConversationService.create rejects', function() {
      chatConversationService.create = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.createConfidentialConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.create).to.have.been.calledWith({_id: conversation._id, name: conversation.name, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, mode: CHAT_CONVERSATION_MODE.CHANNEL});
      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The deleteConversation function', function() {
    it('should call chatConversationService.deleteConversation and save new channel in store', function() {
      chatConversationService.deleteConversation = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.deleteConversation = sinon.spy();

      chatConversationActionsService.deleteConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.deleteConversation).to.have.been.calledWith(conversation._id);
      expect(chatConversationsStoreService.deleteConversation).to.have.been.calledWith(conversation);
    });

    it('should reject when chatConversationService.deleteConversation rejects', function() {
      chatConversationService.deleteConversation = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.deleteConversation = sinon.spy();

      chatConversationActionsService.deleteConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.deleteConversation).to.have.been.calledWith(conversation._id);
      expect(chatConversationsStoreService.deleteConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The getConversation function', function() {
    it('should call chatConversationsStoreService.findConversation', function() {
      chatConversationsStoreService.findConversation = sinon.spy(function() {
        return conversation;
      });

      chatConversationActionsService.getConversation(conversation._id);
      $rootScope.$digest();

      expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(conversation._id);
    });

    it('should call chatConversationService.get if chatConversationsStoreService.findConversation returns nothing', function() {
      chatConversationsStoreService.findConversation = sinon.spy();

      chatConversationService.get = sinon.spy(function() {
        return $q.when([]);
      });
      chatConversationActionsService.getConversation(conversation._id);

      $rootScope.$digest();

      expect(chatConversationService.get).to.have.been.calledWith(conversation._id);
    });
  });

  describe('The increaseNumberOfUnreadMessages function', function() {
    it('should call the equivalent function in chatConversationsStoreService', function() {
      chatConversationsStoreService.increaseNumberOfUnreadMessages = sinon.spy();
      chatConversationActionsService.increaseNumberOfUnreadMessages(conversation._id);

      expect(chatConversationsStoreService.increaseNumberOfUnreadMessages).to.have.been.calledWith(conversation._id);
    });
  });

  describe('The joinConversation function', function() {
    it('should call chatConversationService.join and chatConversationsStoreService.joinConversation', function() {
      chatConversationService.join = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.joinConversation = sinon.spy();

      chatConversationActionsService.joinConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.join).to.have.been.calledWith(conversation._id, sessionMock.user._id);
      expect(chatConversationsStoreService.joinConversation).to.have.been.calledWith(conversation);
    });

    it('should reject when chatConversationService.join rejects', function() {
      chatConversationService.join = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.joinConversation = sinon.spy();

      chatConversationActionsService.joinConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.join).to.have.been.calledWith(conversation._id, sessionMock.user._id);
      expect(chatConversationsStoreService.joinConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The leaveConversation function', function() {
    it('should call chatConversationService.leave and chatConversationsStoreService.deleteConversation', function() {
      chatConversationService.leave = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.deleteConversation = sinon.spy();

      chatConversationActionsService.leaveConversation(conversation);
      $rootScope.$digest();

      expect(chatConversationService.leave).to.have.been.calledWith(conversation._id, sessionMock.user._id);
      expect(chatConversationsStoreService.deleteConversation).to.have.been.calledWith(conversation);
    });

    it('should reject when chatConversationService.leave rejects', function() {
      chatConversationService.leave = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.deleteConversation = sinon.spy();

      chatConversationActionsService.leaveConversation(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.leave).to.have.been.calledWith(conversation._id, sessionMock.user._id);
      expect(chatConversationsStoreService.deleteConversation).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The markAllMessagesAsRead function', function() {
    it('should call chatConversationService.markAsRead and chatConversationsStoreService.markAllMessagesAsRead', function() {
      chatConversationService.markAsRead = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationsStoreService.markAllMessagesAsRead = sinon.spy();

      chatConversationActionsService.markAllMessagesAsRead(conversation);
      $rootScope.$digest();

      expect(chatConversationService.markAsRead).to.have.been.calledWith(conversation._id);
      expect(chatConversationsStoreService.markAllMessagesAsRead).to.have.been.calledWith(conversation);
    });

    it('should reject when chatConversationService.markAsRead rejects', function() {
      chatConversationService.markAsRead = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationsStoreService.markAllMessagesAsRead = sinon.spy();

      chatConversationActionsService.markAllMessagesAsRead(conversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.markAsRead).to.have.been.calledWith(conversation._id);
      expect(chatConversationsStoreService.markAllMessagesAsRead).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The memberHasBeenAdded function', function() {
    var member;

    beforeEach(function() {
      member = {member: {id: 1}};
    });

    it('should skip when current user is not the member', function() {
      member.member.id = '!' + sessionMock.user._id;

      chatConversationActionsService.memberHasBeenAdded(conversation, member);

      expect(chatConversationNameService.getName).to.not.have.been.called;
      expect(chatDesktopNotificationService.notify).to.not.have.been.called;
    });

    it('should notify the user that he has been added even if conversation name is not resolved', function(done) {
      member.member.id = sessionMock.user._id;
      chatConversationsStoreService.joinConversation = sinon.spy();
      chatConversationNameService.getName = sinon.spy(function() {
        return $q.when();
      });

      chatConversationActionsService.memberHasBeenAdded(conversation, member)
        .then(function() {

          expect(chatConversationsStoreService.joinConversation).to.have.been.calledWith(conversation);
          expect(chatConversationNameService.getName).to.have.been.called;
          expect(chatDesktopNotificationService.notify).to.have.been.called;
          expect(chatDesktopNotificationService.notify.firstCall.args[0]).to.match(/Welcome to new conversation/);
          done();
        }, done);
        $rootScope.$digest();
    });

    it('should notify the user that he has been added even if conversation name rejects', function(done) {
      member.member.id = sessionMock.user._id;
      chatConversationsStoreService.joinConversation = sinon.spy();
      chatConversationNameService.getName = sinon.spy(function() {
        return $q.reject(new Error());
      });

      chatConversationActionsService.memberHasBeenAdded(conversation, member)
        .then(function() {
          expect(chatConversationsStoreService.joinConversation).to.have.been.calledWith(conversation);
          expect(chatConversationNameService.getName).to.have.been.called;
          expect(chatDesktopNotificationService.notify).to.have.been.called;
          expect(chatDesktopNotificationService.notify.firstCall.args[0]).to.match(/Welcome to new conversation/);
          done();
        }, done);
        $rootScope.$digest();
    });

    it('should notify the user that he has been added', function(done) {
      var name = 'My Conversation';

      member.member.id = sessionMock.user._id;
      chatConversationsStoreService.joinConversation = sinon.spy();
      chatConversationNameService.getName = sinon.spy(function() {
        return $q.when(name);
      });

      chatConversationActionsService.memberHasBeenAdded(conversation, member)
        .then(function() {
          expect(chatConversationsStoreService.joinConversation).to.have.been.calledWith(conversation);
          expect(chatConversationNameService.getName).to.have.been.called;
          expect(chatDesktopNotificationService.notify).to.have.been.called;
          expect(chatDesktopNotificationService.notify.firstCall.args[0]).to.equal('Welcome to ' + name);
          done();
        }, done);
        $rootScope.$digest();
    });
  });

  describe('The onMessage function', function() {
    var broadcastSpy, logSpy, type, message;

    beforeEach(function() {
      type = 'MyType';
      message = {_id: 1};
      broadcastSpy = sinon.spy($rootScope, '$broadcast');
      logSpy = sinon.spy($log, 'debug');
      chatDesktopNotificationService.notifyMessage = sinon.spy();
    });

    it('should skip then message is current user and user_typing', function() {
      chatMessageUtilsService.isMeTyping = sinon.stub().returns(true);
      chatConversationActionsService.onMessage(type, message);

      expect(chatMessageUtilsService.isMeTyping).to.have.been.calledWith(message);
      expect(logSpy).to.have.been.calledWith('Skipping own typing message');
      expect(broadcastSpy).to.not.have.been.called;
      expect(chatDesktopNotificationService.notifyMessage).to.not.have.been.called;
    });

    it('should broadcast the message and send it to notification service', function() {
      chatMessageUtilsService.isMeTyping = sinon.stub().returns(false);
      chatConversationActionsService.onMessage(type, message);

      expect(chatMessageUtilsService.isMeTyping).to.have.been.calledWith(message);
      expect(logSpy).to.not.have.been.called;
      expect(broadcastSpy).to.have.been.calledWith(type, message);
      expect(chatDesktopNotificationService.notifyMessage).to.have.been.calledWith(message);
    });
  });

  describe('The setActive function', function() {
    it('should call chatConversationsStoreService.setActive', function() {
      chatConversationsStoreService.setActive = sinon.spy();

      chatConversationActionsService.setActive(conversation);
      $rootScope.$digest();

      expect(chatConversationsStoreService.setActive).to.have.been.calledWith(conversation);
    });
  });

  describe('The start function', function() {
    var conversations;

    it('should fetch all the conversations and add them to the store', function() {
      conversations = [
        {
          _id: 1,
          type: CHAT_CONVERSATION_TYPE.OPEN,
          numOfMessage: 10,
          memberStates: {}
        }
      ];
      conversations[0].memberStates[user.id] = {
        numOfReadMessages: 8
      };
      chatConversationService.fetchOpenAndSubscribedConversations = sinon.stub().returns($q.when(conversations));

      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.start();
      $rootScope.$digest();

      expect(chatConversationService.fetchOpenAndSubscribedConversations).to.have.been.called;
      expect(chatConversationsStoreService.addConversation).to.have.been.calledOnce;
    });

    it('should reject when fetchOpenAndSubscribedConversations rejects', function() {
      chatConversationService.fetchOpenAndSubscribedConversations = sinon.stub().returns($q.reject(error));
      chatConversationsStoreService.addConversation = sinon.spy();

      chatConversationActionsService.start();
      $rootScope.$digest();

      expect(chatConversationsStoreService.addConversation).to.not.have.been.called;
      expect(chatConversationService.fetchOpenAndSubscribedConversations).to.have.been.called;
    });
  });

  describe('The unsetActive function', function() {
    it('should reset the activeRoom and broadcast event in the scope', function() {
      var broadcastSpy = sinon.spy($rootScope, '$broadcast');

      chatConversationsStoreService.unsetActive = sinon.spy();

      chatConversationActionsService.unsetActive();

      expect(chatConversationsStoreService.unsetActive).to.have.been.called;
      expect(broadcastSpy).to.have.been.calledWith(CHAT_EVENTS.UNSET_ACTIVE_ROOM);
    });
  });

  describe('The updateConversation function', function() {
    it('should call chatConversationService.update with right parameters and update the store', function() {
      var modifications = {foo: 'bar'};

      chatConversationService.update = sinon.spy(function() {
        return $q.when(result);
      });

      chatConversationActionsService.updateConversation(conversation._id, modifications);
      $rootScope.$digest();

      expect(chatConversationService.update).to.have.been.calledWith(conversation._id, {conversation: conversation._id, modifications: modifications});
    });

    it('should reject when chatConversationService.update rejects', function() {
      var modifications = {foo: 'bar'};

      chatConversationService.update = sinon.spy(function() {
        return $q.reject(error);
      });

      chatConversationActionsService.updateConversation(conversation._id, modifications).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.update).to.have.been.calledWith(conversation._id, {conversation: conversation._id, modifications: modifications});
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The updateConversationTopic function', function() {
    it('should call the chatConversationService.updateTopic function and update the store', function() {
      var topic = 'New topic';

      result.topic = {value: topic};
      chatConversationService.updateTopic = sinon.spy(function() {
        return $q.when(result);
      });
      chatConversationsStoreService.updateTopic = sinon.spy();

      chatConversationActionsService.updateConversationTopic(conversation, topic);
      $rootScope.$digest();

      expect(chatConversationService.updateTopic).to.have.been.calledWith(conversation._id, topic);
      expect(chatConversationsStoreService.updateTopic).to.have.been.calledWith(result.data, result.data.topic);
    });

    it('should reject when chatConversationService.updateTopic rejects', function() {
      var topic = 'New topic';

      chatConversationService.updateTopic = sinon.spy(function() {
        return $q.reject(error);
      });
      chatConversationsStoreService.updateTopic = sinon.spy();

      chatConversationActionsService.updateConversationTopic(conversation, topic).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.updateTopic).to.have.been.calledWith(conversation._id, topic);
      expect(chatConversationsStoreService.updateTopic).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
    });
  });

  describe('The unsubscribePrivateConversation function', function() {
    it('should call chatConversationsStoreService.unsubscribePrivateConversation ', function() {
      chatConversationsStoreService.unsubscribePrivateConversation = sinon.spy();
      chatConversationActionsService.unsubscribePrivateConversation(conversation._id);

      expect(chatConversationsStoreService.unsubscribePrivateConversation).to.have.been.called;
    });
  });

  describe('The updateUserMentionsCount function', function() {
    it('should do nothing when messageUserMentions is null', function() {
      chatConversationsStoreService.increaseUserMentionsCount = sinon.spy();
      chatConversationActionsService.updateUserMentionsCount(conversation._id);

      expect(chatConversationsStoreService.increaseUserMentionsCount).to.not.have.been.called;
    });

    it('should do nothing without current user\'s ID in messageUserMentions', function() {
      var anotherUser = {_id: 'anotherUser'};

      chatConversationsStoreService.increaseUserMentionsCount = sinon.spy();
      chatConversationActionsService.updateUserMentionsCount(conversation._id, [anotherUser]);

      expect(chatConversationsStoreService.increaseUserMentionsCount).to.not.have.been.called;
    });

    it('should call increaseUserMentionsCount when messageUserMentions contains current user\'s ID', function() {
      chatConversationsStoreService.increaseUserMentionsCount = sinon.spy();
      chatConversationActionsService.updateUserMentionsCount(conversation._id, [user]);

      expect(chatConversationsStoreService.increaseUserMentionsCount).to.have.been.called;
    });
  });

  describe('The updateMembers function', function() {
    beforeEach(function() {
      chatConversationsStoreService.setMembers = sinon.spy();
      chatConversationsStoreService.updateMembersCount = sinon.spy();
    });

    it('should not set members in store if conversation is not CONFIDENTIAL', function() {
      chatConversationActionsService.updateMembers({type: CHAT_CONVERSATION_TYPE.OPEN, members: [1]});

      expect(chatConversationsStoreService.setMembers).to.not.have.been.called;
    });

    it('should not set members in store if members is not defined', function() {
      chatConversationActionsService.updateMembers({type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL});

      expect(chatConversationsStoreService.setMembers).to.not.have.been.called;
    });

    it('should set members in store if conversation type is CONFIDENTIAL and members is defined', function() {
      var members = [1, 2, 3];
      var conversation = {type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, members: members};

      chatConversationActionsService.updateMembers(conversation);

      expect(chatConversationsStoreService.setMembers).to.have.been.calledWith(conversation, members);
    });

    it('should not update the members count if not defined', function() {
      chatConversationActionsService.updateMembers({});

      expect(chatConversationsStoreService.updateMembersCount).to.not.have.been.called;
    });

    it('should not update the members count if 0', function() {
      chatConversationActionsService.updateMembers({}, 0);

      expect(chatConversationsStoreService.updateMembersCount).to.not.have.been.called;
    });

    it('should update the members count', function() {
      var count = 10;
      var conversation = {_id: 1};

      chatConversationActionsService.updateMembers(conversation, count);

      expect(chatConversationsStoreService.updateMembersCount).to.have.been.calledWith(conversation, count);
    });
  });

  describe('The currentUserIsCreator function', function() {
    it('should return false if conversation does not have creator', function() {
      var conversation = {
        id: '5b2a32ee35acca5fb249d21c'
      };

      expect(chatConversationActionsService.currentUserIsCreator(conversation)).to.be.false;
    });

    it('should return false if conversation\'s creator does not have id', function() {
      var conversation = {
        creator: {}
      };

      expect(chatConversationActionsService.currentUserIsCreator(conversation)).to.be.false;
    });

    it('should return true if the current user is conversation\'s creator', function() {
      var conversation = {
        creator: user.id
      };

      expect(chatConversationActionsService.currentUserIsCreator(conversation)).to.be.true;
    });
  });
});
