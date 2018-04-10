'use strict';

/* global expect, sinon: false */

describe('The linagora.esn.chat chatConversationAttachmentsProvider', function() {
  var $q, $rootScope, chatConversationService, limit, user, provider, CHAT_ATTACHMENT_PROVIDER, attachmentsMock, chatUsernameMock, emails;
  /*eslint no-unused-vars: "off"*/
  var chatConversationAttachmentsProvider;

  beforeEach(module('linagora.esn.chat', function($provide) {
    limit = 100;
    user = {name: 'Bruce Willis'};
    emails = ['test@test.org'];

    attachmentsMock = [{
      _id: 1,
      creator: {
        _id: 1,
        emails: emails
      }
    },
    {
      _id: 2,
      creator: {
        _id: 2,
        emails: emails
      }
    }];

    chatConversationService = {
      fetchAttachments: sinon.spy(function() {
        return $q.when({data: []});
      })
    };

    chatUsernameMock = {
      getFromCache: sinon.spy(function() {
        return $q.when(user.name);
      })
    };

    $provide.value('newProvider', function(_provider) {
      if (_provider.type === 'chat.conversation') {
        provider = _provider;
      }

      return _provider;
    });

    $provide.value('chatUsername', {
      getFromCache: sinon.spy(function() {
        return $q.when(user.name);
      })
    });

    $provide.value('chatConversationService', chatConversationService);

    $provide.value('searchProviders', {
      add: sinon.spy()
    });

    $provide.value('ELEMENTS_PER_REQUEST', limit);
    $provide.value('chatSearchProviderService', {});
    $provide.value('chatUsername', chatUsernameMock);
  }));

  beforeEach(inject(function(_$rootScope_, _$q_, _CHAT_ATTACHMENT_PROVIDER_, _chatConversationAttachmentsProvider_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatConversationAttachmentsProvider = _chatConversationAttachmentsProvider_;
    CHAT_ATTACHMENT_PROVIDER = _CHAT_ATTACHMENT_PROVIDER_;
  }));

  describe('the fetch function', function() {

    it('should return a function wich paginate over conversation attachments', function() {
      var options = {id: 1};
      var paginate = provider.fetch(options);

      paginate();
      $rootScope.$digest();

      expect(chatConversationService.fetchAttachments).to.have.been.calledWith(options.id, {limit: limit, offset: 0});
    });

    it('should fill response attachments', function(done) {
      var options = {id: 1};
      var paginate = provider.fetch(options);

      chatConversationService.fetchAttachments = sinon.spy(function() {
        return $q.when({data: attachmentsMock});
      });

      paginate().then(function(result) {
        expect(result).to.shallowDeepEqual([{_id: 1, type: CHAT_ATTACHMENT_PROVIDER.conversation, creator: {emails: emails}}, {_id: 2, type: CHAT_ATTACHMENT_PROVIDER.conversation, creator: {emails: emails}}]);

        done();
      });
      $rootScope.$digest();
    });

    it('should fetch next items on next call', function() {
      var options = {id: 1};
      var paginate = provider.fetch(options);

      chatConversationService.fetchAttachments = sinon.spy(function() {
        return $q.when({data: attachmentsMock});
      });

      paginate();
      $rootScope.$digest();
      paginate();
      $rootScope.$digest();

      expect(chatConversationService.fetchAttachments.firstCall).to.have.been.calledWith(options.id, {limit: limit, offset: 0});
      expect(chatConversationService.fetchAttachments.secondCall).to.have.been.calledWith(options.id, {limit: limit, offset: attachmentsMock.length});
    });

    it('should call chatUsername.getFromCache with attachment.creator._id to have the name of the creator', function(done) {
      var options = {id: 1};
      var paginate = provider.fetch(options);

      chatConversationService.fetchAttachments = sinon.spy(function() {
        return $q.when({data: attachmentsMock});
      });

      paginate().then(function(result) {
        var attachment = result[0];

        expect(chatUsernameMock.getFromCache).to.have.been.calledWith(attachment.creator._id);

        done();
      });
      $rootScope.$digest();
    });
  });
});
