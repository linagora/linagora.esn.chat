'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationCreatePrivateController controller', function() {
  var $q,
    form,
    $rootScope,
    $scope,
    $state,
    session,
    chatConversationActionsService,
    notificationFactory,
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

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
  }));

  describe('The create function', function() {
    function initController() {
      var controller = $controller('ChatConversationCreatePrivateController',
        {$scope: $scope},
        {form: form}
      );

      $scope.$digest();

      return controller;
    }

    it('should not create channel when form is invalid', function() {
      form.$invalid = true;
      chatConversationActionsService.createConfidentialConversation = sinon.spy();

      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationActionsService.createConfidentialConversation).to.not.have.been.called;
    });

    it('should display a notification on creation failure', function() {
      chatConversationActionsService.createConfidentialConversation = sinon.spy(function() {
        return $q.reject(new Error());
      });
      notificationFactory.weakError = sinon.spy();

      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationActionsService.createConfidentialConversation).to.have.been.calledWith({domain: session.domain._id, members: []});
      expect(notificationFactory.weakError).to.have.been.calledWith('error', 'Error while creating private conversation');
    });

    it('should add the conversation, notify and redirect to the conversation page', function() {
      var result = {_id: 1};
      var members = [{_id: 1}, {_id: 2}, {_id: 3}];

      chatConversationActionsService.createConfidentialConversation = sinon.spy(function() {
        return $q.when(result);
      });
      notificationFactory.weakSuccess = sinon.spy();
      $state.go = sinon.spy();

      var controller = initController();

      controller.members = members;
      controller.create();
      $rootScope.$digest();
      expect(chatConversationActionsService.createConfidentialConversation).to.have.been.calledWith({domain: session.domain._id, members: [1, 2, 3]});
      expect(notificationFactory.weakSuccess).to.have.been.calledWith('success', 'Private conversation successfuly created');
      expect($state.go).to.have.been.calledWith('chat.channels-views', {id: result._id});
    });
  });
});
