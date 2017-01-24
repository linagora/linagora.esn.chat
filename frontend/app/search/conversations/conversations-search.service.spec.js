'use strict';

/* global sinon: false */

describe('The linagora.esn.chat chatSearchConversationService', function() {
  var chatSearchConversationService, $httpBackend;

  beforeEach(module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
  }));

  beforeEach(inject(function(_chatSearchConversationService_, _$httpBackend_) {
    chatSearchConversationService = _chatSearchConversationService_;
    $httpBackend = _$httpBackend_;
  }));

  it('should call the search API endpoint', function() {
    var query = 'searchme';

    $httpBackend.expectGET('/chat/api/conversations?search=' + query).respond([]);
    chatSearchConversationService.searchConversations(query);
    $httpBackend.flush();
  });
});
