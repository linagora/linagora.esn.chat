'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat composerStateService', function() {
  var $q, localStorageService, chatComposerState, searchProviders, getItem, setItem, getItemResult;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {
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

    module('linagora.esn.chat', function($provide) {
      $provide.value('localStorageService', localStorageService);
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchProviderService', {});
      $provide.value('session', {user: {_id: ''}});
      $provide.value('chatScrollService', {scrollDown: sinon.spy()});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('esnEmoticonRegistry', {getShortNames: sinon.spy()});
    });
  });

  beforeEach(inject(function(_chatComposerState_, _$q_) {
    chatComposerState = _chatComposerState_;
    $q = _$q_;
  }));

  describe('getMessage method', function() {
    it('should call getItem', function() {
      chatComposerState.getMessage('channel1');
      expect(getItem).to.have.been.calledWith('channel1');
    });

    it('should never reject', function() {
      var thenSpy = sinon.spy();

      chatComposerState.getMessage('channel1').catch(thenSpy);
      expect(thenSpy).to.not.have.been.called;
    });
  });

  describe('saveMessage method', function() {
    it('should call setItem', function() {
      chatComposerState.saveMessage('channel1', 'text');
      expect(setItem).to.have.been.calledWith('channel1', 'text');
    });

    it('should never reject', function() {
      var thenSpy = sinon.spy();

      chatComposerState.saveMessage('channel1', 'text').catch(thenSpy);
      expect(thenSpy).to.not.have.been.called;
    });
  });
});
