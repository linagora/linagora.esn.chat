'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The chatParseMention service', function() {
  var chatParseMention;

  beforeEach(angular.mock.module('linagora.esn.chat', function($provide) {
    $provide.value('searchProviders', {
      add: sinon.spy()
    });
    $provide.value('chatSearchMessagesProviderService', {});
  }));

  beforeEach(angular.mock.inject(function(_chatParseMention_) {
    chatParseMention = _chatParseMention_;
  }));

  describe('The chatParseMention function', function() {
    it('should replace mention with the correct link', function() {
      var user_mentions = [{firstname: 'firstname', lastname: 'lastname', _id: 'abcd'}];
      var abcdMention = '<a href="#/profile/abcd/details/view">@firstname.lastname</a>';
      expect(chatParseMention.chatParseMention('Hi @abcd, how are you doing @abcd', user_mentions)).to.equal('Hi ' + abcdMention + ', how are you doing ' + abcdMention);
    });

    it('should replace mention with the display name', function() {
      var user_mentions = [{firstname: 'firstname', lastname: 'lastname', _id: 'abcd'}];
      var abcdMention = '@firstname.lastname';
      expect(chatParseMention.chatParseMention('Hi @abcd, how are you doing @abcd', user_mentions, {skipLink: true})).to.equal('Hi ' + abcdMention + ', how are you doing ' + abcdMention);
    });
  });

  describe('The userIsMentioned function', function() {
    it('should return a array if the mention contain the userId', function() {
      var user = {_id: 'abcd'};
      var message = 'Hi @abcd, how are you ?';
      var userMention = chatParseMention.userIsMentioned(message, user);
      expect(userMention).to.not.be.equal(null);
      expect(userMention[0]).to.be.equal('@abcd');
    });

    it('should return null if the mention don\'t contain the userId', function() {
      var user = {_id: 'abcd'};
      var message = 'Hi @efgh, how are you ?';
      expect(chatParseMention.userIsMentioned(message, user)).to.be.equal(null);
    });
  });
});
