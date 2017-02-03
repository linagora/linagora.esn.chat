'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationListenerService service', function() {

  var $rootScope, conversation, chatNamespace, livenotificationMock, chatParseMention, chatConversationActionsService, chatConversationsStoreService, members, chatConversationListenerService;
  var CHAT_EVENTS;

  beforeEach(function() {
    conversation = {_id: 1, name: 'My conversation'};
    chatConversationActionsService = {};
    chatConversationsStoreService = {};
    chatParseMention = {};
    members = [{_id: 'userId1'}, {_id: 'userId2'}];
    chatNamespace = {
      on: sinon.spy()
    };

    function livenotificationFactory(CHAT_NAMESPACE) {
      livenotificationMock = function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        }

        throw new Error(name + 'namespace has not been mocked', CHAT_NAMESPACE);
      };

      return livenotificationMock;
    }

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: angular.noop
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatParseMention', chatParseMention);
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _chatConversationListenerService_, _CHAT_EVENTS_) {
    $rootScope = _$rootScope_;
    chatConversationListenerService = _chatConversationListenerService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  describe('The livenotification events', function() {
    describe('on CHAT_EVENTS.NEW_CONVERSATION', function() {
      it('should add the conversation to the store', function() {
        chatConversationsStoreService.addConversation = sinon.spy();

        chatConversationListenerService.start();

        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(conversation);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.CONVERSATION_DELETION', function() {
      it('should delete the conversation from the store', function() {
        chatConversationsStoreService.deleteConversation = sinon.spy();

        chatConversationListenerService.start();

        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.CONVERSATION_DELETION, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.deleteConversation).to.have.been.calledWith(conversation);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.CONVERSATIONS.ADD_NEW_MEMBERS', function() {
      it('should add new members in the store', function() {
        conversation.members = members;
        chatConversationsStoreService.addMembers = sinon.spy();

        chatConversationListenerService.start();

        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.CONVERSATIONS.ADD_NEW_MEMBERS, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.addMembers).to.have.been.calledWith(conversation, conversation.members);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.CONVERSATIONS.UPDATE', function() {
      it('should update the conversation in the store', function() {
        chatConversationsStoreService.updateConversation = sinon.spy();

        chatConversationListenerService.start();

        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.CONVERSATIONS.UPDATE, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.updateConversation).to.have.been.calledWith(conversation);

          return true;
        })));
      });
    });
  });

  describe('The $rootScope events', function() {
    describe('on CHAT_EVENTS.CONVERSATIONS.NEW', function() {
      it('should add the conversation to the store', function() {
        chatConversationsStoreService.addConversation = sinon.spy();

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.CONVERSATIONS.NEW, conversation);
        $rootScope.$digest();

        expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(conversation);
      });
    });

    describe('on CHAT_EVENTS.TEXT_MESSAGE', function() {
      var message;

      beforeEach(function() {
        message = {
          _id: 1,
          channel: 2,
          creator: 3,
          text: 'Hello',
          user_mentions: ['foo', 'bar', 'baz'],
          timestamps: {
            creation: new Date()
          }
        };
      });

      it('should do nothing when conversation is not in the store', function() {
        chatConversationsStoreService.findConversation = sinon.spy(function() {});
        chatConversationsStoreService.isActiveRoom = sinon.spy();

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
      });

      it('should update the conversation.last_message to the received one', function() {
        var text = 'My parsed text';

        chatParseMention.parseMentions = sinon.spy(function() {
          return text;
        });
        chatConversationsStoreService.findConversation = sinon.spy(function() {
          return conversation;
        });

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
        expect(chatParseMention.parseMentions).to.have.been.calledWith(message.text, message.user_mentions, {skipLink: true});
        expect(conversation.last_message).to.shallowDeepEqual({
          text: text,
          date: message.timestamps.creation,
          creator: message.creator,
          user_mentions: message.user_mentions
        });
        expect(conversation.canScrollDown).to.be.true;
      });
    });
  });
});
