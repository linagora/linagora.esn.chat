'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatUsername service', function() {
  var $q, $rootScope;
  var chatUsername, CHAT_MENTION_CHAR;
  var username = 'chuck';
  var Cache;
  var userAPIMock;

  beforeEach(angular.mock.module('linagora.esn.chat'));

  beforeEach(function() {
    userAPIMock = {};
    Cache = function() {};
    Cache.prototype.get = sinon.spy();

    angular.mock.module(function($provide) {
      $provide.value('userUtils', {
        displayNameOf: function() { return username; }
      });
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchProviderService', {});
      $provide.value('Cache', Cache);
      $provide.value('userAPI', userAPIMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _chatUsername_, _CHAT_MENTION_CHAR_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatUsername = _chatUsername_;
    CHAT_MENTION_CHAR = _CHAT_MENTION_CHAR_;
  }));

  describe('The generate function', function() {
    it('should return the userUtils.displayNameOf value', function() {
      expect(chatUsername.generate({})).to.equal(username);
    });
  });

  describe('The generateMention function', function() {
    it('should return a value starting with CHAT_MENTION_CHAR', function() {
      expect(chatUsername.generateMention({})[0]).to.equal(CHAT_MENTION_CHAR);
    });
  });

  describe('The getFromCache function', function() {
    it('should call cache.get', function() {
      var id = '1';

      Cache.prototype.get = sinon.spy(function() {
        return $q.when();
      });

      chatUsername.getFromCache(id);

      expect(Cache.prototype.get).to.have.been.calledWith(id);
    });

    it('should add CHAT_MENTION_CHAR to the user name if prependUserWithArobase is true', function(done) {
      var id = '1';
      var userName = 'Themothy Elliot';

      Cache.prototype.get = sinon.spy(function() {
        return $q.when(userName);
      });

      chatUsername.getFromCache(id, true).then(function(user) {
        expect(user).to.equal(CHAT_MENTION_CHAR + 'Themothy Elliot');

        done();
      });

      $rootScope.$digest();
    });

    it('should not add CHAT_MENTION_CHAR to the user name if option is false', function(done) {
      var id = '1';
      var userName = 'Themothy Elliot';

      Cache.prototype.get = sinon.spy(function() {
        return $q.when(userName);
      });

      chatUsername.getFromCache(id, false).then(function(user) {
        expect(user).to.equal('Themothy Elliot');

        done();
      });

      $rootScope.$digest();
    });
  });
});
