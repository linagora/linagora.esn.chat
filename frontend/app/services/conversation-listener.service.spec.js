'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationListenerService service', function() {

  var $rootScope, $q, text, directmessage, conversation, chatMessengerService, chatConversationService, chatParseMention, chatConversationActionsService, chatConversationsStoreService, chatConversationListenerService, session;
  var CHAT_EVENTS, CHAT_CONVERSATION_TYPE;

  beforeEach(function() {
    conversation = {_id: 1, name: 'My conversation'};
    text = 'mytext';
    chatConversationActionsService = {
      getConversation: sinon.spy(function() {
        return $q.when(conversation);
      }),
      addConversation: sinon.spy(function() {
        return $q.when();
      })
    };
    chatConversationsStoreService = {};
    chatConversationService = {};
    chatParseMention = {
      parseMentions: sinon.spy(function() {
      return $q.when(text);
    })};

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
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatParseMention', chatParseMention);
      $provide.value('chatMessengerService', chatMessengerService);
      $provide.value('chatConversationService', chatConversationService);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _chatConversationListenerService_, _CHAT_EVENTS_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    chatConversationListenerService = _chatConversationListenerService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
  }));

  describe('The addEventListeners function', function() {
    it('should register event handlers', function() {
      chatConversationListenerService.addEventListeners();

      expect(chatMessengerService.addEventListener.getCalls().length).to.equal(7);
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

    describe('on CHAT_EVENTS.MEMBER_ADDED_TO_CONVERSATION', function() {
      it('should call memberHasBeenAdded action', function() {
        var event = {conversation: conversation, member: {member: {id: 1}}, by_member: {member: {id: 1}}};

        chatConversationActionsService.memberHasBeenAdded = sinon.spy();

        chatConversationListenerService.addEventListeners();

        expect(chatMessengerService.addEventListener).to.have.been.calledWith(CHAT_EVENTS.MEMBER_ADDED_TO_CONVERSATION, sinon.match.func.and(sinon.match(function(callback) {
          callback(event);

          expect(chatConversationActionsService.memberHasBeenAdded).to.have.been.calledWith(event.conversation, event.member, event.by_member);

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

      it('should do nothing when conversation is not in the store and it is not a direct message', function() {
        chatConversationsStoreService.findConversation = sinon.spy(function() {});
        chatConversationsStoreService.isActiveRoom = sinon.spy();

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
      });

      it('should update the store when conversation is a direct message and is not in the store', function() {
        var text = 'My parsed text';

        directmessage = {_id: 1, name: 'My conversation', type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE};
        chatConversationActionsService.getConversation = sinon.spy(function() {
          return $q.when(directmessage);
        });
        chatConversationActionsService.addConversation = sinon.spy(function() {
          return $q.when(directmessage);
        });
        chatConversationActionsService.increaseNumberOfUnreadMessages = sinon.spy();
        chatConversationActionsService.updateUserMentionsCount = sinon.spy();
        chatConversationsStoreService.findConversation = sinon.spy(function() {});
        chatConversationsStoreService.isActiveRoom = sinon.spy();
        chatParseMention.parseMentions = sinon.spy(function() {
          return $q.when(text);
        });

        chatConversationListenerService.start();

        $rootScope.$emit(CHAT_EVENTS.TEXT_MESSAGE, message);
        $rootScope.$digest();

        expect(chatConversationsStoreService.findConversation).to.have.been.calledWith(message.channel);
        expect(chatConversationActionsService.addConversation).to.have.been.calledWith(directmessage);
        expect(chatParseMention.parseMentions).to.have.been.calledWith(message.text, message.user_mentions, {skipLink: true});
        expect(directmessage.last_message).to.shallowDeepEqual({
          text: text,
          date: message.timestamps.creation,
          creator: message.creator,
          user_mentions: message.user_mentions
        });
        expect(directmessage.canScrollDown).to.be.true;
      });

      it('should update the conversation.last_message to the received one', function() {
        var text = 'My parsed text';

        chatConversationActionsService.increaseNumberOfUnreadMessages = sinon.spy();
        chatConversationActionsService.updateUserMentionsCount = sinon.spy();
        chatParseMention.parseMentions = sinon.spy(function() {
          return $q.when(text);
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
