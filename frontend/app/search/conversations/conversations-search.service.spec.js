'use strict';

/* global chai, sinon: false, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatSearchConversationsService', function() {
  var chatSearchConversationsService, $httpBackend, ELEMENTS_PER_REQUEST, fakeConversationsResult, query = 'searchme';

  beforeEach(module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('ELEMENTS_PER_REQUEST', 3);
      $provide.value('chatSearchProviderService', {});
  }));

  beforeEach(inject(function(_chatSearchConversationsService_, _$httpBackend_, _ELEMENTS_PER_REQUEST_) {
    chatSearchConversationsService = _chatSearchConversationsService_;
    $httpBackend = _$httpBackend_;
    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
    fakeConversationsResult = _.times(ELEMENTS_PER_REQUEST, function() { return { timestamps: { creation: Date.now() }}; });
  }));

  describe('The buildFetcher function', function() {

    it('should call the search API endpoint', function() {
      $httpBackend.expectGET('/chat/api/conversations?limit=' + ELEMENTS_PER_REQUEST + '&offset=0&search=' + query).respond([]);
      chatSearchConversationsService.buildFetcher(query)();
      $httpBackend.flush();
    });

    it('should manage paged results after a series of calls', function() {
      var fetcher = chatSearchConversationsService.buildFetcher(query);

      $httpBackend.expectGET('/chat/api/conversations?limit=' + ELEMENTS_PER_REQUEST + '&offset=0&search=' + query).respond(fakeConversationsResult);
      fetcher();
      $httpBackend.flush();
      $httpBackend.expectGET('/chat/api/conversations?limit=' + ELEMENTS_PER_REQUEST + '&offset=' + ELEMENTS_PER_REQUEST + '&search=' + query).respond(fakeConversationsResult);
      fetcher();
      $httpBackend.flush();
    });

    it('should set a date property with provided results', function(done) {
      var fetcher = chatSearchConversationsService.buildFetcher(query);

      $httpBackend.when('GET', '/chat/api/conversations?limit=' + ELEMENTS_PER_REQUEST + '&offset=0&search=' + query).respond(fakeConversationsResult);
      fetcher().then(function(result) {
        expect(_.compact(_.map(result, 'date')).length).to.equal(ELEMENTS_PER_REQUEST);
        done();
      });
      $httpBackend.flush();
    });

  });
});
