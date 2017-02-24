'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationListenerService service', function() {

  var $rootScope, conversation, chatMessengerService, chatParseMention, chatConversationActionsService, chatConversationsStoreService, chatConversationListenerService, session;
  var CHAT_EVENTS, CHAT_CONVERSATION_TYPE;

  beforeEach(function() {
    conversation = {_id: 1, name: 'My conversation'};
    chatConversationActionsService = {};
    chatConversationsStoreService = {};
    chatParseMention = {};

    chatMessengerService = {
      addEventListener: sinon.spy()
    };

    session = {
      user: {
        _id: '_userId'
      }
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: angular.noop
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatParseMention', chatParseMention);
      $provide.value('chatMessengerService', chatMessengerService);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _chatConversationListenerService_, _CHAT_EVENTS_, _CHAT_CONVERSATION_TYPE_) {
    $rootScope = _$rootScope_;
    chatConversationListenerService = _chatConversationListenerService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
  }));

  describe('The addEventListeners function', function() {
    it('should register event handlers', function() {
      chatConversationListenerService.addEventListeners();

      expect(chatMessengerService.addEventListener.getCalls().length).to.equal(6);
    });

    describe('on CHAT_EVENTS.NEW_CONVERSATION', function() {
      it('should not add the public conversation to the store if user is not the creator', function() {
        var aPublicConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.OPEN, creator: { _id: 'userId1' }};

        chatConversationsStoreService.addConversation = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(aPublicConversation);

          expect(chatConversationsStoreService.addConversation).to.not.have.been.called;

          return true;
        })));
      });

      it('should add the public conversation to the store if I am the creator', function() {
        var aPublicConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.OPEN, creator: { _id: '_userId' }};

        chatConversationsStoreService.addConversation = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(aPublicConversation);

          expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(aPublicConversation);

          return true;
        })));
      });

      it('should add the confidential conversation to the store', function() {
        var aConfidentialConversation = { _id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, creator: { _id: 'userId1' }};

        chatConversationsStoreService.addConversation = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(aConfidentialConversation);

          expect(chatConversationsStoreService.addConversation).to.have.been.calledWith(aConfidentialConversation);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.CONVERSATION_DELETION', function() {
      it('should delete the conversation from the store', function() {
        chatConversationsStoreService.deleteConversation = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.CONVERSATION_DELETION, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.deleteConversation).to.have.been.calledWith(conversation);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.MEMBER_JOINED_CONVERSATION', function() {
      it('should call updateMembers action', function() {
        var event = {conversation: conversation, members_count: 10};

        chatConversationActionsService.updateMembers = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.MEMBER_JOINED_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(event);

          expect(chatConversationActionsService.updateMembers).to.have.been.calledWith(event.conversation, event.members_count);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.MEMBER_LEFT_CONVERSATION', function() {
      it('should call updateMembers action', function() {
        var event = {conversation: conversation, members_count: 10};

        chatConversationActionsService.updateMembers = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.MEMBER_LEFT_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(event);

          expect(chatConversationActionsService.updateMembers).to.have.been.calledWith(event.conversation, event.members_count);

          return true;
        })));
      });
    });

    describe('on CHAT_EVENTS.CONVERSATIONS.UPDATE', function() {
      it('should update the conversation in the store', function() {
        chatConversationsStoreService.updateConversation = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.CONVERSATIONS.UPDATE, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation);

          expect(chatConversationsStoreService.updateConversation).to.have.been.calledWith(conversation);

          return true;
        })));
      });
    });
  });

  describe('The $rootScope events', function() {
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

        chatConversationActionsService.increaseNumberOfUnreadMessages = sinon.spy();
        chatConversationActionsService.updateUserMentionsCount = sinon.spy();
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

      it('should update conversation number of unreaded message', function() {
        chatConversationActionsService.increaseNumberOfUnreadMessages = sinon.spy();
        chatConversationActionsService.updateUserMentionsCount = sinon.spy();
        chatParseMention.parseMentions = sinon.spy();
        chatConversationsStoreService.findConversation = sinon.spy(function() {
          return conversation;
        });

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
        expect(chatConversationActionsService.increaseNumberOfUnreadMessages).to.have.been.calledWith(conversation._id);
      });

      it('should update conversation number of user mentions', function() {
        chatConversationActionsService.increaseNumberOfUnreadMessages = sinon.spy();
        chatConversationActionsService.updateUserMentionsCount = sinon.spy();
        chatParseMention.parseMentions = sinon.spy();
        chatConversationsStoreService.findConversation = sinon.spy(function() {
          return conversation;
        });

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
        expect(chatConversationActionsService.updateUserMentionsCount).to.have.been.calledWith(conversation._id, message.user_mentions);
      });
    });
  });
});
