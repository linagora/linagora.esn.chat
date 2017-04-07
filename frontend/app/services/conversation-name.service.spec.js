'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatConversationNameService', function() {
  var chatConversationNameService,
    $rootScope,
    $q,
    chatUsernameMock,
    user;

  beforeEach(angular.mock.module('linagora.esn.chat'));

  beforeEach(function() {
    user = {_id: 'userId'};

    chatUsernameMock = {
      getFromCache: sinon.spy(function() {
        return $q.when();
      })
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatUsername', chatUsernameMock);
      $provide.value('session', {user: user});
    });
  });

  beforeEach(angular.mock.inject(function(_chatConversationNameService_, _$rootScope_, _$q_) {
    chatConversationNameService = _chatConversationNameService_;
    $rootScope = _$rootScope_;
    $q = _$q_;
  }));

  describe('The getName function', function() {

    it('should resolve with empty object when conversation is undefined', function(done) {
      chatConversationNameService.getName().then(function(name) {
        expect(name).to.not.exist;

        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with empty object when conversation does not contains name nor members', function(done) {
      chatConversationNameService.getName({}).then(function(name) {
        expect(name).to.not.exist;

        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with the conversation.name when defined', function(done) {
      var name = 'MyConversation';

      chatConversationNameService.getName({name: name}).then(function(_name) {
        expect(_name).to.equal(name);

        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with the member name when conversation.members.length === 1', function(done) {
      var name = 'Bruce Willis';

      chatUsernameMock.getFromCache = sinon.spy(function() {
        return $q.when(name);
      });

      chatConversationNameService.getName({members: [{member: {id: 'id', objectType: 'user'}}]}).then(function(_name) {
        expect(_name).to.equal(name);
        expect(chatUsernameMock.getFromCache).to.have.been.calledWith('id', true);

        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with concatenated member names excluding the current one', function(done) {
      var names = {id1: 'Bruce Willis', id2: 'John Doe'};

      chatUsernameMock.getFromCache = sinon.spy(function(id) {
        return $q.when(names[id]);
      });

      chatConversationNameService.getName({members: [
        {member: {id: user._id, objectType: 'user'}},
        {member: {id: 'id1', objectType: 'user'}},
        {member: {id: 'id2', objectType: 'user'}}
      ]}).then(function(_name) {
        expect(_name === 'Bruce Willis, John Doe' || name === 'John Doe, Bruce Willis').to.be.true;
        expect(chatUsernameMock.getFromCache).to.have.been.calledTwice;
        expect(chatUsernameMock.getFromCache).to.have.been.calledWith('id1', true);
        expect(chatUsernameMock.getFromCache).to.have.been.calledWith('id2', true);

        done();
      }, done);
      $rootScope.$digest();
    });
  });
});
