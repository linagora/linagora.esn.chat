'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatLastConversationService service', function() {
  var $rootScope, $q, localStorageService, chatLastConversationService, getItem, setItem, getItemResult, setItemResult, userId, conversationId;
  var successSpy, errorSpy;
  var CHAT_LOCAL_STORAGE;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {
    userId = 'userID';

    conversationId = 'conversationTest';

    getItem = sinon.spy(function() {
      return getItemResult;
    });

    setItem = sinon.spy(function() {
      return setItemResult;
    });

    localStorageService = {
      getOrCreateInstance: sinon.stub().returns({
        getItem: getItem,
        setItem: setItem
      })
    };

    errorSpy = sinon.spy();

    successSpy = sinon.spy();
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('localStorageService', localStorageService);
      $provide.value('session', {user: {_id: userId}});
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$q_, _chatLastConversationService_, _CHAT_LOCAL_STORAGE_) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      chatLastConversationService = _chatLastConversationService_;
      CHAT_LOCAL_STORAGE = _CHAT_LOCAL_STORAGE_;

      getItemResult = $q.when({_id: conversationId});
      setItemResult = $q.when({});
    });
  });

  it('should initialize local storage', function() {
    expect(localStorageService.getOrCreateInstance).to.have.been.calledWith(CHAT_LOCAL_STORAGE.LAST_CONVERSATION);
  });

  describe('The get function', function() {
    it('should retrieve item from local storage', function() {
      chatLastConversationService.get().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(getItem).to.have.been.calledWith(userId);
      expect(successSpy).to.have.been.calledWith(conversationId);
      expect(errorSpy).to.not.have.been.called;
    });

    it('should return undefined when no item found in storage', function() {
      getItemResult = $q.when();

      chatLastConversationService.get().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(getItem).to.have.been.calledWith(userId);
      expect(successSpy).to.have.been.calledWith(undefined);
      expect(errorSpy).to.not.have.been.called;
    });

    it('should relay the local storage error', function() {
      var error = new Error('I failed to get the last conversation');

      getItemResult = $q.reject(error);

      chatLastConversationService.get().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledWith(error);
    });
  });

  describe('The set function', function() {
    it('should save in local storage with right parameters', function() {
      chatLastConversationService.set(conversationId).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(setItem).to.have.been.calledWith(userId, { _id: conversationId });
      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
    });

    it('should reject when input conversation id is undefined', function() {
      chatLastConversationService.set().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(setItem).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.getCalls()[0].args[0].message).to.equal('Conversation id is required');
    });

    it('should relay the local storage error', function() {
      chatLastConversationService.set(conversationId).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(setItem).to.have.been.calledWith(userId, {_id: conversationId});
      expect(successSpy).to.have.been.called;
      expect(errorSpy).to.not.have.been.called;
    });
  });
});
