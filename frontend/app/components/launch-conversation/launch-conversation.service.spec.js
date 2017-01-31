'use strict';

/* global expect, sinon: false */

describe('The chatLaunchConversationService service', function() {

  var chatLaunchConversationService, chatConversationsService, $q, $rootScope, $state, conversation, userIds;

  beforeEach(module('linagora.esn.chat', function($provide) {
    userIds = null;
    conversation = {_id: 1};
    chatConversationsService = {};
    $state = {
      go: sinon.spy()
    };

    $provide.value('chatConversationsService', chatConversationsService);
    $provide.value('$state', $state);
    $provide.value('searchProviders', {
      add: sinon.spy()
    });
    $provide.value('chatSearchMessagesProviderService', {});
    $provide.value('chatSearchConversationsProviderService', {});
  }));

  beforeEach(inject(function(_$rootScope_, _$q_, _chatLaunchConversationService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatLaunchConversationService = _chatLaunchConversationService_;
  }));

  describe('The launch function', function() {

    it('should call the addPrivateConversation with array of members even when given user is a single element', function() {
      userIds = 1;
      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: conversation});
      });

      chatLaunchConversationService.launch(userIds);
      $rootScope.$digest();

      expect(chatConversationsService.addPrivateConversation).to.have.been.calledWith({members: [userIds]});
    });

    it('should call the addPrivateConversation with given members', function() {
      userIds = [1, 2, 3];
      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: conversation});
      });

      chatLaunchConversationService.launch(userIds);
      $rootScope.$digest();

      expect(chatConversationsService.addPrivateConversation).to.have.been.calledWith({members: userIds});
    });

    it('should call the given onSuccess handler on success', function() {
      var successSpy = sinon.spy();

      userIds = [1];
      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: conversation});
      });

      chatLaunchConversationService.launch(userIds, successSpy);
      $rootScope.$digest();

      expect(successSpy).to.have.been.calledWith(conversation);
      expect($state.go).to.not.have.been.called;
    });

    it('should redirect to default conversation page when onSuccess is not defined', function() {
      userIds = [1];
      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: conversation});
      });

      chatLaunchConversationService.launch(userIds);
      $rootScope.$digest();

      expect($state.go).to.have.been.calledWith('chat.channels-views', {id: conversation._id});
    });

    it('should reject when chatConversationsService.addPrivateConversation rejects', function() {
      var error = new Error('I failed');
      var errorSpy = sinon.spy();
      var successSpy = sinon.spy();

      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.reject(error);
      });

      chatLaunchConversationService.launch(userIds).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationsService.addPrivateConversation).to.have.been.calledOnce;
      expect($state.go).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(errorSpy.getCalls()[0].args[0].message).to.equal(error.message);
      expect(successSpy).to.not.have.been.called;
    });

    it('should reject when onSuccess rejects', function() {
      var error = new Error('I failed');
      var onSuccessSpy = sinon.spy(function() {
        return $q.reject(error);
      });
      var errorSpy = sinon.spy();
      var successSpy = sinon.spy();

      chatConversationsService.addPrivateConversation = sinon.spy(function() {
        return $q.when({data: conversation});
      });

      chatLaunchConversationService.launch(userIds, onSuccessSpy).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(onSuccessSpy).to.have.been.calledOnce;
      expect(chatConversationsService.addPrivateConversation).to.have.been.calledOnce;
      expect($state.go).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(errorSpy.getCalls()[0].args[0].message).to.equal(error.message);
      expect(successSpy).to.not.have.been.called;
    });
  });
});
