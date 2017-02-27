'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationCreateChannelController controller', function() {
  var $q,
    form,
    $rootScope,
    $scope,
    $state,
    session,
    chatConversationActionsService,
    notificationFactory,
    CHAT_CONVERSATION_TYPE,
    $controller;

  beforeEach(function() {
    chatConversationActionsService = {};
    notificationFactory = {};
    $state = {};
    form = {};
    session = {
      domain: {
        _id: 123
      }
    };

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('notificationFactory', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$state', $state);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
  }));

  describe('The create function', function() {
    function initController() {
      var controller = $controller('ChatConversationCreateChannelController',
        {$scope: $scope},
        {form: form}
      );

      $scope.$digest();

      return controller;
    }

    it('should not create channel when form is invalid', function() {
      form.$invalid = true;
      chatConversationActionsService.createOpenConversation = sinon.spy();
      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationActionsService.createOpenConversation).to.not.have.been.called;
    });

    it('should display a notification on creation failure', function() {
      chatConversationActionsService.createOpenConversation = sinon.spy(function() {
        return $q.reject(new Error());
      });
      notificationFactory.weakError = sinon.spy();

      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationActionsService.createOpenConversation).to.have.been.calledWith(controller.conversation);
      expect(notificationFactory.weakError).to.have.been.calledWith('error', 'Error while creating channel');
    });

    it('should add the conversation, notify and redirect to the conversation page', function() {
      var result = {_id: 1};
      var name = 'My conversation';

      chatConversationActionsService.createOpenConversation = sinon.spy(function() {
        return $q.when(result);
      });
      notificationFactory.weakSuccess = sinon.spy();
      $state.go = sinon.spy();

      var controller = initController();

      controller.create();
      controller.conversation.name = name;
      $rootScope.$digest();
      expect(chatConversationActionsService.createOpenConversation).to.have.been.calledWith({type: CHAT_CONVERSATION_TYPE.OPEN, name: name, domain: session.domain._id});
      expect(notificationFactory.weakSuccess).to.have.been.calledWith('success', 'Channel successfuly created');
      expect($state.go).to.have.been.calledWith('chat.channels-views', {id: result._id});
    });
  });
});
