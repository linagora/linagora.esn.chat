'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationCreatePrivateController controller', function() {
  var $q,
    form,
    $rootScope,
    $scope,
    $state,
    chatConversationsService,
    chatLocalStateService,
    notificationFactory,
    $controller;

  beforeEach(function() {
    chatConversationsService = {};
    chatLocalStateService = {};
    notificationFactory = {};
    $state = {};
    form = {};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('notificationFactory', {});
      $provide.value('chatConversationsService', chatConversationsService);
      $provide.value('chatLocalStateService', chatLocalStateService);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$state', $state);
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
      chatConversationsService.addPrivateConversation = sinon.spy();

      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationsService.addPrivateConversation).to.not.have.been.called;
    });

    it('should display a notification on creation failure', function() {
      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.reject(new Error());
      });
      notificationFactory.weakError = sinon.spy();

      var controller = initController();

      controller.create();
      $rootScope.$digest();
      expect(chatConversationsService.addPrivateConversation).to.have.been.calledWith({members: []});
      expect(notificationFactory.weakError).to.have.been.calledWith('error', 'Error while creating private conversation');
    });

    it('should add the conversation to the cache on creation success, notify and redirect to the conversation page', function() {
      var result = {_id: 1};
      var members = [1, 2, 3];

      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: result});
      });
      chatLocalStateService.addConversation = sinon.spy();
      notificationFactory.weakSuccess = sinon.spy();
      $state.go = sinon.spy();

      var controller = initController();

      controller.members = members;
      controller.create();
      $rootScope.$digest();
      expect(chatConversationsService.addPrivateConversation).to.have.been.calledWith({members: members});
      expect(chatLocalStateService.addConversation).to.have.been.calledWith(result);
      expect(notificationFactory.weakSuccess).to.have.been.calledWith('success', 'Private conversation successfuly created');
      expect($state.go).to.have.been.calledWith('chat.channels-views', {id: result._id});
    });
  });
});
