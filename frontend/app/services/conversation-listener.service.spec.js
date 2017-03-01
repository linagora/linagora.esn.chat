'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationListenerService service', function() {

  var $rootScope, $q, conversation, chatMessengerService, chatConversationService, chatParseMention, chatConversationActionsService, chatConversationsStoreService, chatConversationListenerService, session;
  var CHAT_EVENTS;

  beforeEach(function() {
    conversation = {_id: 1, name: 'My conversation'};
    chatConversationActionsService = {};
    chatConversationsStoreService = {};
    chatConversationService = {};
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
      $provide.value('chatConversationService', chatConversationService);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _chatConversationListenerService_, _CHAT_EVENTS_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatConversationListenerService = _chatConversationListenerService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  describe('The addEventListeners function', function() {
    it('should register event handlers', function() {
      chatConversationListenerService.addEventListeners();

      expect(chatMessengerService.addEventListener.getCalls().length).to.equal(6);
    });

    describe('on CHAT_EVENTS.NEW_CONVERSATION', function() {
      it('should reject when chatConversationService.get rejects', function(done) {
        var error = new Error('I failed');

        chatConversationActionsService.addConversationWhenCreatorOrConfidential = sinon.spy();
        chatConversationService.get = sinon.spy(function() {
          return $q.reject(error);
        });

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation).then(function() {
            done(new Error('Should not be called'));
          }).catch(function(err) {
            expect(err.message).to.equal(error.message);
            expect(chatConversationService.get).to.have.been.calledWith(conversation._id);
            expect(chatConversationActionsService.addConversationWhenCreatorOrConfidential).to.not.have.been.called;
            done();
          });

          return true;
        })));
        $rootScope.$digest();
      });

      it('should call chatConversationActionsService.addConversationWhenCreatorOrConfidential with chatConversationService.get result', function(done) {
        var result = {_id: 1, name: 'Foo'};

        chatConversationActionsService.addConversationWhenCreatorOrConfidential = sinon.spy(function() {
          return $q.when();
        });
        chatConversationService.get = sinon.spy(function() {
          return $q.when(result);
        });

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(conversation).then(function() {
            expect(chatConversationService.get).to.have.been.calledWith(conversation._id);
            expect(chatConversationActionsService.addConversationWhenCreatorOrConfidential).to.have.been.calledWith(result);
            done();
          }).catch(done);

          return true;
        })));
        $rootScope.$digest();

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
