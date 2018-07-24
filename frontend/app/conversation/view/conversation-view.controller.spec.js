'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationViewController controller', function() {
  var $rootScope, $controller, $q, $stateParams;
  var scope,
    sessionMock,
    uuid4,
    chatConversationServiceMock,
    chatConversationMemberService,
    chatConversationActionsService,
    chatScrollServiceMock,
    chatConversationsStoreService,
    chatMessageServiceMock,
    usSpinnerServiceMock,
    user,
    searchProviders,
    channelId;
  var CHAT_EVENTS, CHAT, CHAT_MESSAGE_GROUP, CHAT_DRAG_FILE_CLASS, ESN_APP_STATE_CHANGE_EVENT;

  beforeEach(function() {

    CHAT = {
      DEFAULT_FETCH_SIZE: 3
    };

    chatConversationServiceMock = {};

    chatConversationMemberService = {};

    usSpinnerServiceMock = {
      spin: function() {},
      stop: function() {}
    };

    chatConversationActionsService = {
      setActive: sinon.spy(),
      markAllMessagesAsRead: sinon.spy()
    };

    chatScrollServiceMock = {
      scrollDown: function() {},
      setCanScrollDown: sinon.spy(function() {
        return $q.when([]);
      }),
      canScrollDown: sinon.spy(function() {
        return $q.when([]);
      })
    };

    chatMessageServiceMock = {
      isSystemMessage: sinon.spy(function() {
        return $q.when([]);
      })
    };

    $stateParams = {
      id: '123'
    };

    user = {_id: 'userId'};

    sessionMock = {user: user};

    uuid4 = {};

    chatConversationsStoreService = {
      activeRoom: {},
      ready: {
        then: function(callback) {
          callback();
        }
      }
    };

    searchProviders = {
      add: sinon.spy()
    };

    channelId = '583e9769ecac5c59a19fe6af';

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('uuid4', uuid4);
      $provide.value('chatConversationService', chatConversationServiceMock);
      $provide.value('usSpinnerService', usSpinnerServiceMock);
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatConversationMemberService', chatConversationMemberService);
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatMessageService', chatMessageServiceMock);
      $provide.constant('CHAT', CHAT);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_EVENTS_, _$stateParams_, _CHAT_MESSAGE_GROUP_, _CHAT_DRAG_FILE_CLASS_, _ESN_APP_STATE_CHANGE_EVENT_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_EVENTS = _CHAT_EVENTS_;
    CHAT_MESSAGE_GROUP = _CHAT_MESSAGE_GROUP_;
    CHAT_DRAG_FILE_CLASS = _CHAT_DRAG_FILE_CLASS_;
    ESN_APP_STATE_CHANGE_EVENT = _ESN_APP_STATE_CHANGE_EVENT_;
    $stateParams = _$stateParams_;
  }));

  function initController(ctrl, callOnInit) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    if (callOnInit) {
      controller.$onInit();
    }

    return controller;
  }

  function initCtrl(callOnInit) {
    return initController('ChatConversationViewController as vm', callOnInit);
  }

  function generateMessage(creatorId, timestamps, number, startingId) {
    var messages = [];

    for (var i = 0; i < number; i++) {
      messages.push({_id: startingId + i, creator: {_id: creatorId}, timestamps: {creation: timestamps}});
    }

    return messages;
  }

  describe('on $scope chat:message:text event', function() {

    var message;

    beforeEach(function() {
      $stateParams.id = null;
      message = {_id: 1, creator: {_id: 'userId'}, timestamps: {creation: 3}, text: 'haha'};
      chatConversationServiceMock.fetchMessages = function() {
        return $q.when([]);
      };
    });

    it('should not add the message if message does not have a channel', function() {
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.be.empty;
    });

    it('should add the message if message channel is the current one', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message.channel = channel;
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.shallowDeepEqual([message]);
    });

    it('should not add the message if message channel is not the current one', function() {
      chatConversationsStoreService.activeRoom._id = 1;
      message.channel = 2;
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.be.empty;
    });

    it('should call scrollDown after adding the message', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message.channel = channel;
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.shallowDeepEqual([message]);
      expect(chatScrollServiceMock.setCanScrollDown).to.be.called;
    });

    it('should not add the message if already in conversation messages', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      var ctrl = initCtrl(true);
      var messages = [{_id: 1, creator: {_id: 'userId'}, timestamps: {creation: 3}, text: 'haha', channel: channel }, {_id: 2, creator: {_id: 'userId'}, timestamps: {creation: 3}, text: 'haha', channel: channel}];

      ctrl.messages = messages;

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, messages[0]);
      $rootScope.$digest();

      expect(scope.vm.messages).to.deep.equal(messages);
    });

    it('should add the message if not already in conversation messages', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message.channel = channel;
      var ctrl = initCtrl(true);

      ctrl.messages = [{_id: 10, creator: {_id: 'userId10'}, timestamps: {creation: 10}, text: 'haha' }, {_id: 20, creator: {_id: 'userId20'}, timestamps: {creation: 30}, text: 'haha'}];

      expect(scope.vm.messages.length).to.deep.equal(2);
      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages.length).to.equal(3);
      expect(scope.vm.messages).to.contain(message);
    });

    it('should generate new _id then add the message if the message have no _id', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message = { creator: {_id: 'userId'}, timestamps: {creation: 40}, text: 'haha' };
      uuid4.generate = function() {
        return 1;
      };
      message.channel = channel;
      var ctrl = initCtrl(true);

      ctrl.messages = [{_id: 10, creator: {_id: 'userId10'}, timestamps: {creation: 10}, text: 'haha' }, {_id: 20, creator: {_id: 'userId20'}, timestamps: {creation: 30}, text: 'haha'}];

      expect(scope.vm.messages.length).to.deep.equal(2);
      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages.length).to.equal(3);
      expect(scope.vm.messages).to.contain(message);
      expect(scope.vm.messages[2]._id).to.equal(1);
    });
  });

  describe('on $scope chat:message:file event', function() {

    var message;

    beforeEach(function() {
      $stateParams.id = null;
      message = {_id: 1, creator: {_id: 'userId'}, timestamps: {creation: 3}};
      chatConversationServiceMock.fetchMessages = function() {
        return $q.when([]);
      };
    });

    it('should not add the message if message does not have a channel', function() {
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.be.empty;
    });

    it('should add the message if message channel is the current one', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message.channel = channel;
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.shallowDeepEqual([message]);
    });

    it('should not add the message if message channel is the current one', function() {
      chatConversationsStoreService.activeRoom._id = 1;
      message.channel = 2;
      initCtrl(true);

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages).to.be.empty;
    });

    it('should generate new _id then add the message if the message have no _id', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message = { creator: {_id: 'userId'}, timestamps: {creation: 40}, text: 'haha' };
      uuid4.generate = function() {
        return 1;
      };
      message.channel = channel;
      var ctrl = initCtrl(true);

      ctrl.messages = [{_id: 10, creator: {_id: 'userId10'}, timestamps: {creation: 10}, text: 'haha' }, {_id: 20, creator: {_id: 'userId20'}, timestamps: {creation: 30}, text: 'haha'}];

      expect(scope.vm.messages.length).to.deep.equal(2);
      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages.length).to.equal(3);
      expect(scope.vm.messages).to.contain(message);
      expect(scope.vm.messages[2]._id).to.equal(1);
    });
  });

  describe('on $scope chat:message:bot event', function() {

    var message;

    beforeEach(function() {
      $stateParams.id = null;
      chatConversationServiceMock.fetchMessages = function() {
        return $q.when([]);
      };
    });

    it('should generate new _id then add the message if the message have no _id', function() {
      var channel = 1;

      chatConversationsStoreService.activeRoom._id = channel;
      message = { creator: {_id: 'userId'}, timestamps: {creation: 40}, text: 'haha' };
      uuid4.generate = function() {
        return 1;
      };
      message.channel = channel;
      var ctrl = initCtrl(true);

      ctrl.messages = [{_id: 10, creator: {_id: 'userId10'}, timestamps: {creation: 10}, text: 'haha' }, {_id: 20, creator: {_id: 'userId20'}, timestamps: {creation: 30}, text: 'haha'}];

      expect(scope.vm.messages.length).to.deep.equal(2);
      scope.$emit(CHAT_EVENTS.BOT_MESSAGE, message);
      $rootScope.$digest();

      expect(scope.vm.messages.length).to.equal(3);
      expect(scope.vm.messages).to.contain(message);
      expect(scope.vm.messages[2]._id).to.equal(1);
    });
  });

  describe('The $onInit function', function() {
    it('should fetch messages', function() {
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      var ctrl = initCtrl();

      ctrl.$onInit();
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.have.been.called.once;
    });

    it('should mark all messages in the conversation as read', function() {
      chatConversationsStoreService.activeRoom = { _id: channelId };
      chatConversationServiceMock.fetchMessages = sinon.stub().returns($q.when([]));
      var ctrl = initCtrl();

      ctrl.$onInit();
      $rootScope.$digest();

      expect(chatConversationActionsService.markAllMessagesAsRead).to.have.been.calledWith({ _id: channelId });
    });

    it('should mark all messages in the conversation as read if the app state changed from background to foreground', function() {
      chatConversationServiceMock.fetchMessages = sinon.stub().returns($q.when([]));
      var ctrl = initCtrl();

      ctrl.$onInit();
      $rootScope.$digest();
      expect(chatConversationActionsService.markAllMessagesAsRead).to.have.been.calledOnce;

      $rootScope.$broadcast(ESN_APP_STATE_CHANGE_EVENT, true);
      $rootScope.$digest();
      expect(chatConversationActionsService.markAllMessagesAsRead).to.have.been.calledTwice;
    });
  });

  describe('The loadPreviousMessages function', function() {

    it('should call chatConversationService.fetchMessages', function() {
      chatConversationsStoreService.activeRoom._id = channelId;
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      initCtrl();
      scope.vm.loadPreviousMessages();
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith(channelId);
    });

    it('should catch error when chatConversationService.fetchMessages rejects', function() {
      var error = new Error('I failed');
      var successSpy = sinon.spy();
      var errorSpy = sinon.spy();

      chatConversationsStoreService.activeRoom._id = channelId;
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.reject(error);
      });

      initCtrl();
      scope.vm.loadPreviousMessages().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith(channelId);
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.getCalls()[0].args[0].message).to.equal('Error while fetching messages');
    });

    it('should call chatConversationService.fetchMessages with before parameter when messages are already available', function() {
      var message = {_id: 1};

      chatConversationsStoreService.activeRoom._id = channelId;
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      initCtrl();
      scope.vm.messages.push(message);
      scope.vm.topOfConversation = false;
      scope.vm.loadPreviousMessages();
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith(channelId, {before: message._id, limit: CHAT.DEFAULT_FETCH_SIZE});
    });

    it('should populate controller messages', function() {
      var messages = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      chatConversationsStoreService.activeRoom._id = channelId;
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when(messages);
      });

      initCtrl();
      scope.vm.loadPreviousMessages(true);
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.have.been.calledOnce;
      expect(scope.vm.messages.length).to.equal(messages.length);
    });

    it('should load messages in correct order', function() {
      var messages = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when(messages);
      });

      initCtrl();
      scope.vm.loadPreviousMessages(true);
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
      expect(scope.vm.messages).to.deep.equal(messages);
    });

    it('should load messages in correct order when older messages are loaded', function() {
      var olderMessages = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      var currentMessages = [
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 4, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      CHAT.DEFAULT_FETCH_SIZE = 2;
      chatConversationServiceMock.fetchMessages = sinon.stub();
      chatConversationServiceMock.fetchMessages.onCall(0).returns($q.when(currentMessages));
      chatConversationServiceMock.fetchMessages.onCall(1).returns($q.when(olderMessages));

      initCtrl();

      scope.vm.topOfConversation = false;
      scope.vm.loadPreviousMessages(true);
      scope.$digest();
      scope.vm.loadPreviousMessages();
      scope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.have.been.calledTwice;
      expect(scope.vm.messages).to.shallowDeepEqual([
        {_id: 1},
        {_id: 2},
        {_id: 3},
        {_id: 4}
      ]);
    });

    it('should set the topOfConversation when fetchMessages sends back less than limit messages', function() {
      var firstCall = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 4, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 5, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 6, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 7, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 8, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 9, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 10, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      var secondCall = [
        {_id: 11, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 12, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      CHAT.DEFAULT_FETCH_SIZE = 10;
      chatConversationServiceMock.fetchMessages = sinon.stub();
      chatConversationServiceMock.fetchMessages.onCall(0).returns($q.when(firstCall));
      chatConversationServiceMock.fetchMessages.onCall(1).returns($q.when(secondCall));

      initCtrl();
      scope.vm.loadPreviousMessages(true);
      scope.$digest();
      scope.vm.loadPreviousMessages();
      scope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.have.been.calledTwice;
      expect(scope.vm.topOfConversation).to.be.true;
    });

    it('should not fetchMessages when topOfConversation is true', function() {
      var successSpy = sinon.spy();
      var errorSpy = sinon.spy();

      chatConversationServiceMock.fetchMessages = sinon.spy();

      initCtrl();
      scope.vm.topOfConversation = true;
      scope.vm.loadPreviousMessages().then(successSpy, errorSpy);
      scope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.not.have.been.called;
      expect(scope.vm.topOfConversation).to.be.true;
      expect(errorSpy).to.not.have.been.called;
      expect(successSpy).to.have.been.calledWith([]);
    });

    describe('Group messages by sameUser variable', function() {
      var messages;

      it('should set `sameUser` to true when message is created by same user, in timespan and the previous message is not a system one ', function() {
        messages = [
          {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.true;
      });

      it('should set `sameUser` to false when message is created by different user', function() {
        messages = [
          {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 2, creator: {_id: 2}, timestamps: {creation: Date.now()}}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.false;
      });

      it('should set `sameUser` to false when messages creation timestamps spread too far', function() {
        var creationTime = new Date(2015, 4, 29).getTime();

        messages = [
          {_id: 1, creator: {_id: 1}, timestamps: {creation: creationTime}},
          {_id: 2, creator: {_id: 1}, timestamps: {creation: creationTime + CHAT_MESSAGE_GROUP.TIMESPAN}}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.false;
      });

      it('should set `sameUser` to false when the last message is a system one', function() {
        messages = [
          {_id: 1, creator: {_id: 1}, channel: 1, subtype: 'conversation_join', timestamps: {creation: new Date(86440000) }},
          {_id: 2, creator: {_id: 1}, channel: 1, timestamps: {creation: new Date(86500000) }}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.false;
      });

      it('should set `sameUser` to true when message is created by same user, in timespan and the previous message is not a system one ', function() {
        messages = [
          {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 2, creator: {_id: 1}, subtype: 'conversation_join', timestamps: {creation: Date.now()}}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatMessageServiceMock.isSystemMessage).to.have.been.calledOnce;
        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.true;
      });

      it('should set `sameUser` to false when the number of messages is created by same user get to CHAT_MESSAGE_GROUP.SAME_USER_LENGTH ', function() {
        messages = [];
        messages = generateMessage(1, Date.now(), CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1, 0);
        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatMessageServiceMock.isSystemMessage).to.have.been.called;
        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        for (var i = 1; i < CHAT_MESSAGE_GROUP.SAME_USER_LENGTH; i++) {
          expect(scope.vm.messages[i].sameUser).to.be.true;
        }
        expect(scope.vm.messages[CHAT_MESSAGE_GROUP.SAME_USER_LENGTH].sameUser).to.be.false;
      });

      it('should set `sameUser` to false when the number of messages is created by same user get to CHAT_MESSAGE_GROUP.SAME_USER_LENGTH test with diffrent users', function() {
        var generatedMessages = generateMessage(1, Date.now(), CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1, 3);

        messages = [
          {_id: 0, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 2, creator: {_id: 2}, timestamps: {creation: Date.now()}}
        ];
        messages = messages.concat(generatedMessages);
        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatMessageServiceMock.isSystemMessage).to.have.been.called;
        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.true;
        expect(scope.vm.messages[2].sameUser).to.be.false;
        expect(scope.vm.messages[3].sameUser).to.be.false;
        for (var i = 4; i < CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 3; i++) {
          expect(scope.vm.messages[i].sameUser).to.be.true;
        }
        expect(scope.vm.messages[CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 3].sameUser).to.be.false;
      });

      it('should set `sameUser` to false when the number of messages is created by same user get to CHAT_MESSAGE_GROUP.SAME_USER_LENGTH test with x messages from diffrent users and diffrent timestamps', function() {
        var generatedMessages = generateMessage(1, Date.now(), CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1, 0),
          i;

        messages = [];
        messages = messages.concat(generatedMessages);
        generatedMessages = generateMessage(2, Date.now(), CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1, CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1);
        messages = messages.concat(generatedMessages);
        generatedMessages = generateMessage(2, Date.now() + CHAT_MESSAGE_GROUP.TIMESPAN, 1, 2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 2);
        messages = messages.concat(generatedMessages);
        generatedMessages = generateMessage(1, Date.now() + CHAT_MESSAGE_GROUP.TIMESPAN, 1, 2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 3);
        messages = messages.concat(generatedMessages);
        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatMessageServiceMock.isSystemMessage).to.have.been.called;
        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        for (i = 1; i < CHAT_MESSAGE_GROUP.SAME_USER_LENGTH; i++) {
          expect(scope.vm.messages[i].sameUser).to.be.true;
        }
        expect(scope.vm.messages[CHAT_MESSAGE_GROUP.SAME_USER_LENGTH].sameUser).to.be.false;
        expect(scope.vm.messages[CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1].sameUser).to.be.false;
        for (i = CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 2; i < 2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1; i++) {
          expect(scope.vm.messages[i].sameUser).to.be.true;
        }
        expect(scope.vm.messages[2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1].sameUser).to.be.false;
        expect(scope.vm.messages[2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 2].sameUser).to.be.false;
        expect(scope.vm.messages[2 * CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 3].sameUser).to.be.false;
      });

      it('should set `sameUser` to false when the number of messages is created by same user get to CHAT_MESSAGE_GROUP.SAME_USER_LENGTH test with diffrent timestamps ', function() {
        var generatedMessages = generateMessage(1, Date.now() + CHAT_MESSAGE_GROUP.TIMESPAN, CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1, 1);

        messages = [
          {_id: 0, creator: {_id: 1}, timestamps: {creation: Date.now()}}
        ];
        messages = messages.concat(generatedMessages);
        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        chatMessageServiceMock.isSystemMessage = sinon.stub().returns(false);
        initCtrl();
        scope.vm.loadPreviousMessages(true);
        $rootScope.$digest();

        expect(chatMessageServiceMock.isSystemMessage).to.have.been.called;
        expect(chatConversationServiceMock.fetchMessages).to.have.been.calledOnce;
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.false;
        for (var i = 2; i < CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1; i++) {
          expect(scope.vm.messages[i].sameUser).to.be.true;
        }
        expect(scope.vm.messages[CHAT_MESSAGE_GROUP.SAME_USER_LENGTH + 1].sameUser).to.be.false;
      });
    });
  });

  describe('The onDragOver function', function() {
    it('should return CHAT_DRAG_FILE_CLASS.IS_MEMBER when user is member', function() {
      chatConversationMemberService.currentUserIsMemberOf = sinon.spy(function() {
        return true;
      });

      initCtrl();

      expect(scope.vm.onDragOver()).to.equal(CHAT_DRAG_FILE_CLASS.IS_MEMBER);
      expect(chatConversationMemberService.currentUserIsMemberOf).to.have.been.calledOnce;
    });

    it('should return CHAT_DRAG_FILE_CLASS.IS_NOT_MEMBER when user is not member', function() {
      chatConversationMemberService.currentUserIsMemberOf = sinon.spy(function() {
        return false;
      });

      initCtrl();

      expect(scope.vm.onDragOver()).to.equal(CHAT_DRAG_FILE_CLASS.IS_NOT_MEMBER);
      expect(chatConversationMemberService.currentUserIsMemberOf).to.have.been.calledOnce;
    });
  });
});
