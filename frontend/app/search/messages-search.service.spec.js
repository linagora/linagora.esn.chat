'use strict';

/* global chai, sinon, _: false */

describe('The linagora.esn.chat chatSearchMessageService', function() {
  var chatSearchMessageService, $httpBackend, $rootScope;

  beforeEach(module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
  }));

  beforeEach(inject(function(_chatSearchMessageService_, _$rootScope_, _$httpBackend_) {
    chatSearchMessageService = _chatSearchMessageService_;
    $httpBackend =  _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  it('should call the search API endpoint', function() {
    var query = 'searchme';

    $httpBackend.expectGET('/chat/api/messages?search=' + query).respond([]);
    chatSearchMessageService.searchMessages(query);
    $httpBackend.flush();
  });
});
