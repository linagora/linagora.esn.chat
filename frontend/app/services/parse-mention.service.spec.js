'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatParseMention service', function() {
  var $rootScope, $q, chatParseMention, chatUsernameMock;

  beforeEach(angular.mock.module('linagora.esn.chat', function($provide) {
    $provide.value('searchProviders', {
      add: sinon.spy()
    });
    $provide.value('chatSearchMessagesProviderService', {});
    $provide.value('chatSearchConversationsProviderService', {});
  }));

  beforeEach(function() {
    chatUsernameMock = {};

    angular.mock.module(function($provide) {
      $provide.value('chatUsername', chatUsernameMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$q_, _chatParseMention_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatParseMention = _chatParseMention_;
  }));

  describe('The chatParseMention function', function() {
    it('should replace mention with the correct link', function(done) {
      var user_mentions = [{firstname: 'firstname', lastname: 'lastname', _id: 'abcd'}];
      var abcdMention = '<a href="#/profile/abcd/details/view">@firstname.lastname</a>';

      chatUsernameMock.getFromCache = sinon.spy(function() {
        return $q.when('@firstname.lastname');
      });

      chatParseMention.parseMentions('Hi @abcd, how are you doing @abcd', user_mentions).then(function(result) {
        expect(result).to.equal('Hi ' + abcdMention + ', how are you doing ' + abcdMention);
        expect(chatUsernameMock.getFromCache).to.have.been.calledWith('abcd', true);

        done();
      });

      $rootScope.$digest();
    });

    it('should replace mention with the display name if skipLink option is true', function(done) {
      var user_mentions = [{firstname: 'firstname', lastname: 'lastname', _id: 'abcd'}];
      var abcdMention = '@firstname.lastname';
      var option = {
        skipLink: true
      };

      chatUsernameMock.getFromCache = sinon.spy(function() {
        return $q.when('@firstname.lastname');
      });

      chatParseMention.parseMentions('Hi @abcd, how are you doing @abcd', user_mentions, option).then(function(result) {
        expect(result).to.equal('Hi ' + abcdMention + ', how are you doing ' + abcdMention);
        expect(chatUsernameMock.getFromCache).to.have.been.calledWith('abcd', true);

        done();
      });

      $rootScope.$digest();
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
