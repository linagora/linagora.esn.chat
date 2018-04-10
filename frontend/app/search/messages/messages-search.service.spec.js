'use strict';

/* global chai, sinon: false, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatSearchMessageService', function() {
  var chatSearchMessagesService, $httpBackend, CHAT, parseMentionsMock, fakeMessagesResult, query = 'searchme';

  beforeEach(module('linagora.esn.chat', function($provide) {
    $provide.value('searchProviders', { add: sinon.spy() });
    $provide.value('chatSearchProviderService', {});
    parseMentionsMock = sinon.spy(function(msg) {return msg;});
    $provide.value('chatParseMention', { parseMentions: parseMentionsMock });
    $provide.value('$filter', function() { return function(str) { return str; }; });
  }));

  beforeEach(inject(function(_chatSearchMessagesService_, _$httpBackend_, _CHAT_) {
    chatSearchMessagesService = _chatSearchMessagesService_;
    $httpBackend = _$httpBackend_;
    CHAT = _CHAT_;
    fakeMessagesResult = _.times(CHAT.DEFAULT_FETCH_SIZE, function() { return { text: 'Hi! ', timestamps: { creation: Date.now() }}; });
  }));

  describe('The buildFetcher function', function() {

    function stubSearchEndpoint(query) {
      $httpBackend.when('GET', '/chat/api/messages?limit=' + CHAT.DEFAULT_FETCH_SIZE + '&offset=0&search=' + query).respond(fakeMessagesResult);
    }

    it('should call the search API endpoint', function() {
      $httpBackend.expectGET('/chat/api/messages?limit=' + CHAT.DEFAULT_FETCH_SIZE + '&offset=0&search=' + query).respond([]);
      chatSearchMessagesService.buildFetcher(query)();
      $httpBackend.flush();
    });

    it('should manage paged results after a series of calls', function() {
      var fetcher = chatSearchMessagesService.buildFetcher(query);

      $httpBackend.expectGET('/chat/api/messages?limit=' + CHAT.DEFAULT_FETCH_SIZE + '&offset=0&search=' + query).respond(fakeMessagesResult);
      fetcher();
      $httpBackend.flush();
      $httpBackend.expectGET('/chat/api/messages?limit=' + CHAT.DEFAULT_FETCH_SIZE + '&offset=' + CHAT.DEFAULT_FETCH_SIZE + '&search=' + query).respond(fakeMessagesResult);
      fetcher();
      $httpBackend.flush();
    });

    it('should parse mentions for every result message', function(done) {
      stubSearchEndpoint(query);
      chatSearchMessagesService.buildFetcher(query)()
        .then(function() {
          expect(parseMentionsMock.callCount).to.equal(CHAT.DEFAULT_FETCH_SIZE);
          done();
        });
      $httpBackend.flush();
    });

    it('should set a date property with provided results', function(done) {
      var fetcher = chatSearchMessagesService.buildFetcher(query);

      stubSearchEndpoint(query);
      fetcher().then(function(result) {
        expect(_.compact(_.map(result, 'date')).length).to.equal(CHAT.DEFAULT_FETCH_SIZE);
        done();
      });
      $httpBackend.flush();
    });

  });
});
