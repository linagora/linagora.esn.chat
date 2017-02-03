'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationViewController controller', function() {
  var scope,
    $q,
    sessionMock,
    chatConversationServiceMock,
    chatConversationActionsService,
    CHAT_EVENTS,
    CHAT,
    MESSAGE_GROUP_TIMESPAN,
    chatScrollServiceMock,
    chatConversationsStoreService,
    chatMessageServiceMock,
    $stateParams,
    usSpinnerServiceMock,
    $rootScope,
    $controller,
    user,
    searchProviders,
    chatLastConversationServiceMock,
    channelId;

  beforeEach(function() {

    CHAT = {
      DEFAULT_FETCH_SIZE: 3
    };

    chatConversationServiceMock = {};

    usSpinnerServiceMock = {
      spin: function() {}
    };

    chatConversationActionsService = {
      setActive: sinon.spy()
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

    chatLastConversationServiceMock = {
      getConversationId: sinon.spy(function() {
        return $q.when(channelId);
      })
    };
    channelId = '583e9769ecac5c59a19fe6af';

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('chatConversationService', chatConversationServiceMock);
      $provide.value('usSpinnerService', usSpinnerServiceMock);
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatLastConversationService', chatLastConversationServiceMock);
      $provide.value('chatMessageService', chatMessageServiceMock);
      $provide.constant('CHAT', CHAT);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_EVENTS_, _$stateParams_, _MESSAGE_GROUP_TIMESPAN_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_EVENTS = _CHAT_EVENTS_;
    MESSAGE_GROUP_TIMESPAN = _MESSAGE_GROUP_TIMESPAN_;
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

  describe('on $scope chat:message:text event', function() {

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
  });

  describe('The $onInit function', function() {

    it('should set current conversationId as active', function() {
      chatConversationActionsService.setActive = sinon.spy();
      chatConversationServiceMock.fetchMessages = function() {
        return $q.when([]);
      };

      var ctrl = initCtrl();

      ctrl.$onInit();
      $rootScope.$digest();

      expect(chatConversationActionsService.setActive).to.have.been.called;
    });

    it('should fetch messages', function() {
      chatConversationActionsService.setActive = sinon.spy();
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      var ctrl = initCtrl();

      ctrl.$onInit();
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.have.been.called.once;
    });
  });

  describe('The loadPreviousMessages function', function() {

    it('should call chatConversationService.fetchMessages', function() {
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      initCtrl();
      scope.vm.loadPreviousMessages();
      $rootScope.$digest();

      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith(channelId);
    });

    it('should call chatConversationService.fetchMessages with before parameter when messages are already available', function() {
      var message = {_id: 1};

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
          {_id: 2, creator: {_id: 1}, timestamps: {creation: creationTime + MESSAGE_GROUP_TIMESPAN}}
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
    });
  });
});
