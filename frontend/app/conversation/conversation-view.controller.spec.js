'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat ChatConversationViewController controller', function() {
  var scope,
    $q,
    sessionMock,
    chatConversationServiceMock,
    chatConversationsServiceMock,
    CHAT_EVENTS,
    CHAT,
    MESSAGE_GROUP_TIMESPAN,
    chatScrollServiceMock,
    chatLocalStateServiceMock,
    $stateParams,
    usSpinnerServiceMock,
    $rootScope,
    $controller,
    searchProviders,
    localStorageService,
    getItemResult,
    getItem,
    setItem,
    chatComposerState;

  beforeEach(function() {

    chatConversationServiceMock = {
      fetchMessages: sinon.spy(function() {
        return $q.when([]);
      })
    };

    usSpinnerServiceMock = {
      spin: function() {}
    };

    chatConversationsServiceMock = {
      getChannels: sinon.spy(function() {
        return $q.when([]);
      }),
      getPrivateConversations: sinon.spy(function() {
        return $q.when([]);
      })
    };

    chatScrollServiceMock = {
      scrollDown: function() {}
    };

    $stateParams = {
      id: '123'
    };

    sessionMock = {};

    chatLocalStateServiceMock = {
      activeRoom: {},
      setActive: sinon.spy(),
      unsetActive: sinon.spy(),
      ready: {
        then: function(callback) {
          callback();
        }
      }
    };

    searchProviders = {
      add: sinon.spy()
    };

    getItemResult = 'test';

    getItem = sinon.spy(function(key) {
      return $q.when(({
        text: getItemResult
      })[key]);
    });

    setItem = sinon.spy(function() {
      return $q.when({});
    });

    localStorageService = {
      getOrCreateInstance: sinon.stub().returns({
        getItem: getItem,
        setItem: setItem
      })
    };

    chatComposerState = {
      saveMessage: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('chatConversationService', chatConversationServiceMock);
      $provide.value('usSpinnerService', usSpinnerServiceMock);
      $provide.value('chatConversationsService', chatConversationsServiceMock);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('chatLocalStateService', chatLocalStateServiceMock);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('searchProviders', searchProviders);
      $provide.value('localStorageService', localStorageService);
      $provide.value('chatComposerState', chatComposerState);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _chatLocalStateService_, _chatConversationService_, _chatConversationsService_, _chatScrollService_, _CHAT_EVENTS_, _CHAT_, _$stateParams_, _usSpinnerService_, _MESSAGE_GROUP_TIMESPAN_) {

    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_EVENTS = _CHAT_EVENTS_;
    CHAT = _CHAT_;
    MESSAGE_GROUP_TIMESPAN = _MESSAGE_GROUP_TIMESPAN_;
    $stateParams = _$stateParams_;
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  function initCtrl() {
    return initController('ChatConversationViewController as vm');
  }

  describe('on $scope chat:message:text event', function() {

    var message;

    beforeEach(function() {
      $stateParams.id = null;
      message = {_id: 1, creator: 2, timestamps: {creation: 3}};
    });

    it('should not add the message if message does not have a channel', function() {
      initCtrl();

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.be.empty;
    });

    it('should add the message if message channel is the current one', function() {
      var channel = 1;

      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initCtrl();

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.shallowDeepEqual([message]);
    });

    it('should not add the message if message channel is the current one', function() {
      chatLocalStateServiceMock.activeRoom._id = 1;
      message.channel = 2;
      initCtrl();

      scope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.be.empty;
    });
  });

  describe('on $scope chat:message:file event', function() {

    var message;

    beforeEach(function() {
      $stateParams.id = null;
      message = {_id: 1, creator: 2, timestamps: {creation: 3}};
    });

    it('should not add the message if message does not have a channel', function() {
      initCtrl();

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.be.empty;
    });

    it('should add the message if message channel is the current one', function() {
      var channel = 1;

      chatLocalStateServiceMock.activeRoom._id = channel;
      message.channel = channel;
      initCtrl();

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.shallowDeepEqual([message]);
    });

    it('should not add the message if message channel is the current one', function() {
      chatLocalStateServiceMock.activeRoom._id = 1;
      message.channel = 2;
      initCtrl();

      scope.$emit(CHAT_EVENTS.FILE_MESSAGE, message);
      $rootScope.$digest();
      expect(scope.vm.messages).to.be.empty;
    });
  });

  describe('when chatLocalStateService is ready', function() {

    it('should update local state with current conversationId', function() {
      chatConversationServiceMock.fetchMessages = function() {
        return $q.when([]);
      };

      initCtrl();
      $rootScope.$digest();
      expect(chatLocalStateServiceMock.setActive).to.be.calledWith($stateParams.id);
    });

    it('should fetch messages', function() {
      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      initCtrl();
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
      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith($stateParams.id);
    });

    it('should call chatConversationService.fetchMessages with before parameter when messages are already available', function() {
      var message = {_id: 1};

      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when([]);
      });

      initCtrl();
      scope.vm.messages.push(message);
      scope.vm.loadPreviousMessages();
      $rootScope.$digest();
      expect(chatConversationServiceMock.fetchMessages).to.be.calledWith($stateParams.id, {before: message._id, limit: CHAT.DEFAULT_FETCH_SIZE});
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

      expect(chatConversationServiceMock.fetchMessages).to.be.called;
      expect(scope.vm.messages.length).to.equal(messages.length);
    });

    it('should load messages in correct order when init directive', function() {
      var messages = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when(messages);
      });

      initCtrl();
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

      chatConversationServiceMock.fetchMessages = sinon.stub();
      chatConversationServiceMock.fetchMessages.onCall(0).returns($q.when(currentMessages));
      chatConversationServiceMock.fetchMessages.onCall(1).returns($q.when(olderMessages));

      initCtrl();
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

    describe('Group messages by sameUser variable', function() {
      var messages;

      it('should set `sameUser` to true when message is created by same user and in timespan', function() {
        messages = [
          {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
          {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}}
        ];

        chatConversationServiceMock.fetchMessages = sinon.spy(function() {
          return $q.when(messages);
        });

        initCtrl();
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
        expect(scope.vm.messages[0].sameUser).to.be.false;
        expect(scope.vm.messages[1].sameUser).to.be.false;
      });

    });
  });

  describe('on $scope $destroy event', function() {

    it('should save current composing message', function() {
      scope.text = 'test';
      initCtrl();

      scope.$broadcast('$destroy');
      expect(chatComposerState.saveMessage).to.have.been.calledWith($stateParams.id, {text: scope.text});
    });

    it('should unsetActive current active room', function() {
      chatLocalStateServiceMock.activeRoom._id = $stateParams.id;
      initCtrl();

      scope.$broadcast('$destroy');
      expect(chatLocalStateServiceMock.unsetActive).to.have.been.called;
    });
  });
});
