'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversationStateService', function() {
  var $q, localStorageService, chatLastConversationService, searchProviders, getItem, setItem, getItemResult, userId, conversationId;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    userId = 'userID';
    searchProviders = {
      add: sinon.spy()
    };

    getItemResult = 'conversationTest';
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

    conversationId = 'conversationTest';

    module('linagora.esn.chat', function($provide) {
      $provide.value('localStorageService', localStorageService);
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', {user: {_id: ''}});
      $provide.value('chatScrollService', {scrollDown: sinon.spy()});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('esnEmoticonRegistry', {getShortNames: sinon.spy()});
    });
  });

  beforeEach(function() {
    inject(function(_$q_, _chatLastConversationService_) {
      chatLastConversationService = _chatLastConversationService_;
      $q = _$q_;
    });
  });

  describe('getConversationId method', function() {

    it('should call getItem', function() {

      chatLastConversationService.getConversationId(userId);
      expect(getItem).to.have.been.calledWith(userId);
    });

    it('should never reject', function() {
      var thenSpy = sinon.spy();

      chatLastConversationService.getConversationId(userId).catch(thenSpy);
      expect(thenSpy).to.not.have.been.called;
    });
  });

  describe('saveConversationId method', function() {
    it('should call setItem', function() {
      chatLastConversationService.saveConversationId(userId, conversationId);
      expect(setItem).to.have.been.calledWith(userId, { conversationId: conversationId });
    });

    it('should never reject', function() {
      var thenSpy = sinon.spy();

      chatLastConversationService.saveConversationId(userId, conversationId).catch(thenSpy);
      expect(thenSpy).to.not.have.been.called;
    });
  });
});
