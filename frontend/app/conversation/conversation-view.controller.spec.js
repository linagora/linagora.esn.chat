'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat ChatConversationViewController controller', function() {
  var scope,
    $q,
    sessionMock,
    chatConversationService,
    chatConversationServiceMock,
    chatConversationsService,
    chatConversationsServiceMock,
    CHAT_EVENTS,
    CHAT,
    chatScrollService,
    chatScrollServiceMock,
    chatLocalStateService,
    chatLocalStateServiceMock,
    $stateParams,
    $rootScope,
    $controller,
    user,
    searchProviders;

  beforeEach(function() {

    chatConversationServiceMock = {};

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

    user = {_id: 'userId'};

    sessionMock = {};

    chatLocalStateServiceMock = {
      activeRoom: {},
      setActive: sinon.spy(),
      ready: {
        then: function(callback) {
          callback();
        }
      }
    };

    searchProviders = {
      add: sinon.spy()
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('chatConversationService', chatConversationServiceMock);
      $provide.value('chatConversationsService', chatConversationsServiceMock);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatScrollService', chatScrollServiceMock);
      $provide.value('chatLocalStateService', chatLocalStateServiceMock);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('searchProviders', searchProviders);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _chatLocalStateService_, _chatConversationService_, _chatConversationsService_, _chatScrollService_, _CHAT_EVENTS_, _CHAT_, _$stateParams_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    chatLocalStateService = _chatLocalStateService_;
    chatConversationService = _chatConversationService_;
    chatConversationsService = _chatConversationsService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    CHAT = _CHAT_;
    chatScrollService = _chatScrollService_;
    chatLocalStateService = _chatLocalStateService_;
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
      $stateParams.id = null;
      var messages = [
        {_id: 1, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 2, creator: {_id: 1}, timestamps: {creation: Date.now()}},
        {_id: 3, creator: {_id: 1}, timestamps: {creation: Date.now()}}
      ];

      chatConversationServiceMock.fetchMessages = sinon.spy(function() {
        return $q.when(messages);
      });

      initCtrl();
      scope.vm.loadPreviousMessages();
      $rootScope.$digest();
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
  });
});
