'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessengerService factory', function() {
  var chatMessengerService, chatWebsocketMessengerService, get;

  beforeEach(function() {
    get = {foo: 'bar'};
    chatWebsocketMessengerService = {
      get: function() {return get;}
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatWebsocketMessengerService', chatWebsocketMessengerService);
    });
  });

  beforeEach(angular.mock.inject(function(_chatMessengerService_) {
    chatMessengerService = _chatMessengerService_;
  }));

  it('should return the chatWebsocketMessengerService.get result', function() {
    expect(chatMessengerService).to.equals(get);
  });
});
