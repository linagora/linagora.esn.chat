'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat chatConversationNameService', function() {
  var chatConversationNameService,
    CHAT_CONVERSATION_TYPE,
    userUtilsMock,
    user;

  beforeEach(angular.mock.module('linagora.esn.chat'));

  beforeEach(function() {
    user = {_id: 'userId'};

    userUtilsMock = {
      displayNameOf: sinon.spy(function(user) {
        return user.firstname + ' ' + user.lastname;
      })
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('userUtils', userUtilsMock);
      $provide.value('session', {user: user});
    });
  });

  beforeEach(angular.mock.inject(function(_chatConversationNameService_, _CHAT_CONVERSATION_TYPE_) {
    chatConversationNameService = _chatConversationNameService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
  }));

  describe('The getName function', function() {

    it('should use userUtils.displayNameOf when options.onlyFirstName is not defined', function() {
      expect(chatConversationNameService.getName({
        members: [{_id: user._id, firstname: 'John', lastname: 'Doe'}]
      })).to.equal('John Doe');
      expect(userUtilsMock.displayNameOf).to.have.been.called;
    });

    it('should use user firstname when options.onlyFirstName is defined', function() {
      expect(chatConversationNameService.getName({
        members: [{_id: user._id, firstname: 'John', lastname: 'Doe'}]
      }, {onlyFirstName: true})).to.equal('John');
      expect(userUtilsMock.displayNameOf).to.not.have.been.called;
    });

    it('should not use the current user name', function() {
      expect(chatConversationNameService.getName({
        members: [{_id: user._id, firstname: 'John', lastname: 'Doe'}, {_id: 'youId', firstname: 'Bruce', lastname: 'Willis'}]
      })).to.equal('Bruce Willis');
      expect(userUtilsMock.displayNameOf).to.have.been.called;
    });

    it('should generate name from all members', function() {
      expect(chatConversationNameService.getName({
        members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id: 3, firstname: 'Kenny', lastname: 'McCormick'}]
      })).to.equal('Eric Cartman, Stan Marsh, Kenny McCormick');
    });

    it('should return conversation name if it is defined no matter the type of the conversation', function() {
      _.map(CHAT_CONVERSATION_TYPE, function(type) {
        expect(chatConversationNameService.getName({
          name: 'name',
          type: type,
          members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id: 3, firstname: 'Kenny', lastname: 'McCormick'}]
        })).to.equal('name');
      });
    });
  });
});
