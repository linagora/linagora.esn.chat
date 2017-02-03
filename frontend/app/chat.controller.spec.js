'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The ChatController controller', function() {
  var $q,
    scope,
    $rootScope,
    $controller,
    groups,
    channels,
    session,
    user,
    chatConversationActionsService,
    chatNotificationService,
    chatConversationsStoreService,
    chatLastConversationService,
    conversationId,
    CHAT_CONVERSATION_TYPE;

  beforeEach(function() {
    user = {_id: 'userId'};

    session = {
      user: user,
      ready: { then: _.constant(user)}
    };

    chatConversationsStoreService = {
      activeRoom: {}
    };

    chatConversationActionsService = {
      setActive: sinon.spy()
    };

    chatLastConversationService = {
      getConversationId: sinon.spy(function() {
        return $q.when(conversationId);
      })
    };

    chatNotificationService = {};

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', session);
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatNotificationService', chatNotificationService);
      $provide.value('chatLastConversationService', chatLastConversationService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_CONVERSATION_TYPE_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    scope = $rootScope.$new();
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.OPEN}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.OPEN}];
    conversationId = '583e9769ecac5c59a19fe6af';
    chatConversationsStoreService.channels = channels;
    chatConversationsStoreService.privateConversations = groups;
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  function initCtrl() {
    return initController('ChatController as vm');
  }

  it('should instanciate chatConversationsStoreService', function() {
    initCtrl();
    $rootScope.$digest();

    expect(scope.vm.chatConversationsStoreService).to.be.equal(chatConversationsStoreService);
  });

  describe('The $onInit function', function() {
    it('should call setActive with the default channel if the chatLastConversation Service return nothing', function() {
      chatLastConversationService.getConversationId = sinon.spy(function() {
        return $q.when();
      });

      var controller = initCtrl();

      controller.$onInit();
      $rootScope.$digest();

      expect(chatLastConversationService.getConversationId).to.have.been.calledWith(session.user._id);
      expect(chatConversationActionsService.setActive).to.have.been.calledWith(channels[0]._id);
    });

    it('should call setActive with the channelId returned by the chatLastConversation service', function() {
      chatLastConversationService.getConversationId = sinon.spy(function() {
        return $q.when(conversationId);
      });

      var controller = initCtrl();

      controller.$onInit();
      $rootScope.$digest();

      expect(chatLastConversationService.getConversationId).to.have.been.calledWith(session.user._id);
      expect(chatConversationActionsService.setActive).to.have.been.calledWith(conversationId);
    });

    it('should not try to get the last conversation when active room id defined', function() {
      chatConversationsStoreService.activeRoom._id = 1;

      chatLastConversationService.getConversationId = sinon.spy(function() {
        return $q.when(conversationId);
      });

      var controller = initCtrl();

      controller.$onInit();
      $rootScope.$digest();

      expect(chatLastConversationService.getConversationId).to.not.have.been.called;
    });
  });
});
