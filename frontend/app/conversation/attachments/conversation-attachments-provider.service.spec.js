'use strict';

/* global expect, sinon: false */

describe('The linagora.esn.chat chatConversationAttachmentsProvider', function() {
  var $q, $rootScope, chatConversationService, username, provider, CHAT_ATTACHMENT_PROVIDER;
  /*eslint no-unused-vars: "off"*/
  var chatConversationAttachmentsProvider;

  beforeEach(module('linagora.esn.chat', function($provide) {
    username = 'Bruce Willis';
    chatConversationService = {
      fetchAttachments: sinon.spy(function() {
        return $q.when({data: []});
      })
    };

    $provide.value('newProvider', function(_provider) {
      if (_provider.type === 'chat.conversation') {
        provider = _provider;
      }

      return _provider;
    });

    $provide.value('chatUsername', {
      generate: sinon.spy(function() {
        return username;
      })
    });

    $provide.value('chatConversationService', chatConversationService);

    $provide.value('searchProviders', {
      add: sinon.spy()
    });

    $provide.value('chatSearchMessagesProviderService', {});
  }));

  beforeEach(inject(function(_$rootScope_, _$q_, _CHAT_ATTACHMENT_PROVIDER_, _chatConversationAttachmentsProvider_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatConversationAttachmentsProvider = _chatConversationAttachmentsProvider_;
    CHAT_ATTACHMENT_PROVIDER = _CHAT_ATTACHMENT_PROVIDER_;
  }));

  describe('the fetch function', function() {

    it('should return a function wich paginate over conversation attachments', function() {
      var options = {id: 1, limit: 2};
      var paginate = provider.fetch(options);

      paginate();
      $rootScope.$digest();

      expect(chatConversationService.fetchAttachments).to.have.been.calledWith(options.id, {limit: options.limit, offset: 0});
    });

    it('should fill response attachments', function(done) {
      var options = {id: 1, limit: 2};
      var response = [{_id: 1}, {_id: 2}];
      var paginate = provider.fetch(options);

      chatConversationService.fetchAttachments = sinon.spy(function() {
        return $q.when({data: response});
      });

      paginate().then(function(result) {
        expect(result).to.deep.equals([{_id: 1, type: CHAT_ATTACHMENT_PROVIDER.conversation, displayName: username}, {_id: 2, type: CHAT_ATTACHMENT_PROVIDER.conversation, displayName: username}]);
        done();
      });
      $rootScope.$digest();
    });

    it('should fetch next items on next call', function() {
      var options = {id: 1, limit: 2};
      var response = [{_id: 1}, {_id: 2}];
      var paginate = provider.fetch(options);

      chatConversationService.fetchAttachments = sinon.spy(function() {
        return $q.when({data: response});
      });

      paginate();
      $rootScope.$digest();
      paginate();
      $rootScope.$digest();

      expect(chatConversationService.fetchAttachments.firstCall).to.have.been.calledWith(options.id, {limit: options.limit, offset: 0});
      expect(chatConversationService.fetchAttachments.secondCall).to.have.been.calledWith(options.id, {limit: options.limit, offset: response.length});
    });
  });
});
