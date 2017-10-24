'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationsStoreService service', function() {

  var $q, members, chatConversationsStoreService, conversation, publicConversation, confidentialConversation, user, chatPrivateConversationService;
  var CHAT_CONVERSATION_TYPE, CHAT_MEMBER_STATUS;

  beforeEach(function() {
    conversation = {_id: 3, name: 'My conversation'};
    publicConversation = {_id: 1, name: 'My public conversation'};
    confidentialConversation = {_id: 2, name: 'My confidential conversation'};
    members = [{_id: 'userId1'}, {_id: 'userId2'}];
    chatConversationsStoreService = {};
    user = {_id: 'userId'};

    chatPrivateConversationService = {
      get: sinon.spy(function() {
        return $q.when(conversation);
      }),
      store: sinon.spy(function() {
        return $q.when();
      })
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: angular.noop
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', {user: user});
      $provide.value('chatPrivateConversationService', chatPrivateConversationService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _chatConversationsStoreService_, _CHAT_CONVERSATION_TYPE_, _CHAT_MEMBER_STATUS_) {
    chatConversationsStoreService = _chatConversationsStoreService_;
    $q = _$q_;

    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    CHAT_MEMBER_STATUS = _CHAT_MEMBER_STATUS_;

    publicConversation.type = CHAT_CONVERSATION_TYPE.OPEN;
    confidentialConversation.type = CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;
  }));

  describe('The addConversation function', function() {
    it('should not add the conversation in conversations if already in', function() {
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.addConversation(conversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should add the conversation in conversations if not alreay in', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversation(conversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
    });

    it('should add the conversation in channels when type is open', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversation(publicConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([publicConversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([publicConversation]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should add the conversation in privateConversations when type is directmessage', function() {
      confidentialConversation.type = CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversation(confidentialConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([confidentialConversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([confidentialConversation]);
    });

    it('should add the public conversations in channels and order them by alphabetic', function() {
      var publicConversation2 = {_id: 3, name: 'The public conversation', type: CHAT_CONVERSATION_TYPE.OPEN};
      var publicConversation3 = {_id: 4, name: 'A new public conversation', type: CHAT_CONVERSATION_TYPE.OPEN};

      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversations([publicConversation, publicConversation2, publicConversation3]);

      expect(chatConversationsStoreService.conversations).to.deep.equals([publicConversation3, publicConversation, publicConversation2]);
      expect(chatConversationsStoreService.channels).to.deep.equals([publicConversation3, publicConversation, publicConversation2]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should add the private conversations in channels and order them by alphabetic', function() {
      var confidentialConversation2 = {_id: 5, name: 'The confidential conversation', type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE};
      var confidentialConversation3 = {_id: 6, name: 'A new confidential conversation', type: CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE};

      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversations([confidentialConversation, confidentialConversation2, confidentialConversation3]);

      expect(chatConversationsStoreService.conversations).to.deep.equals([confidentialConversation3, confidentialConversation, confidentialConversation2]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([confidentialConversation3, confidentialConversation, confidentialConversation2]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
    });

    it('should call the chatPrivateConversationService.store to update the private conversations', function() {

      chatConversationsStoreService.addConversation(confidentialConversation);
      var conversatrionsIds = chatConversationsStoreService.privateConversations.map(function(privateConversation) {
        return privateConversation._id;
      });

      expect(chatConversationsStoreService.privateConversations).to.deep.equals([confidentialConversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatPrivateConversationService.store).to.be.calledWith(conversatrionsIds);
    });
  });

  describe('The addConversations function', function() {
    it('should do nothing when input is undefined', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversations();

      expect(chatConversationsStoreService.conversations).to.deep.equals([]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should do nothing when input is empty', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversations([]);

      expect(chatConversationsStoreService.conversations).to.deep.equals([]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should add the given conversations to the store', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.addConversations([publicConversation, confidentialConversation]);

      expect(chatConversationsStoreService.conversations.length).to.equal(2);
      expect(chatConversationsStoreService.channels).to.deep.equals([publicConversation]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([confidentialConversation]);
    });
  });

  describe('The setMembers function', function() {
    it('should set members to the conversation if it already exists', function() {
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.setMembers(conversation, members);

      expect(chatConversationsStoreService.conversations[0].members).to.deep.equals(members);
    });

    it('should not add the conversation with new members if it does not exists', function() {
      chatConversationsStoreService.conversations = [];
      chatConversationsStoreService.setMembers(conversation, members);

      expect(chatConversationsStoreService.conversations).to.deep.equals([]);
    });
  });

  describe('The deleteConversation function', function() {
    it('should do nothing when the conversation does not exists', function() {
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.deleteConversation(publicConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should remove conversation from conversations and channels when type is open', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.channels = [publicConversation];
      chatConversationsStoreService.deleteConversation(publicConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });

    it('should remove conversation from conversations and privateConversations when type is confidential', function() {
      chatConversationsStoreService.conversations = [conversation, confidentialConversation];
      chatConversationsStoreService.privateConversations = [confidentialConversation];
      chatConversationsStoreService.deleteConversation(confidentialConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
    });
  });

  describe('The findConversation function', function() {
    it('should return nothing when conversation is not found', function() {
      chatConversationsStoreService.conversations = [conversation];

      expect(chatConversationsStoreService.findConversation(confidentialConversation._id)).to.be.falsy;
    });

    it('should return the conversation from the store', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation, confidentialConversation];

      expect(chatConversationsStoreService.findConversation(conversation._id)).to.deep.equal(conversation);
    });
  });

  describe('The find function', function() {
    it('should return nothing when conversation is not found', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation, confidentialConversation];

      expect(chatConversationsStoreService.find({name: 'foo'})).to.be.falsy;
    });

    it('should return conversation matching the given filter', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation, confidentialConversation];

      expect(chatConversationsStoreService.find({name: conversation.name})).to.deep.equals(conversation);
    });
  });

  describe('The getNumberOfUnreadMessages function', function() {
    it('should return the sum of unreads from all the stored conversations', function() {
      conversation.unreadMessageCount = 2;
      publicConversation.unreadMessageCount = 3;

      chatConversationsStoreService.conversations = [conversation, publicConversation, confidentialConversation];

      expect(chatConversationsStoreService.getNumberOfUnreadMessages()).to.equal(5);
    });
  });

  describe('The increaseNumberOfUnreadMessages function', function() {
    it('should do nothing when conversation not found', function() {
      conversation.unreadMessageCount = 0;
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.increaseNumberOfUnreadMessages(publicConversation._id);

      expect(chatConversationsStoreService.conversations[0].unreadMessageCount).to.equal(conversation.unreadMessageCount);
    });

    it('should increase when received message is not in the active conversation', function() {
      chatConversationsStoreService.conversations = [publicConversation, conversation];
      chatConversationsStoreService.setActive(conversation);
      chatConversationsStoreService.increaseNumberOfUnreadMessages(publicConversation._id);

      expect(chatConversationsStoreService.conversations[0].unreadMessageCount).to.equal(1);
    });

    it('should not increase when received message is in the active conversation', function() {
      chatConversationsStoreService.conversations = [publicConversation, conversation];
      chatConversationsStoreService.setActive(conversation);
      chatConversationsStoreService.increaseNumberOfUnreadMessages(conversation._id);

      expect(chatConversationsStoreService.conversations[1].unreadMessageCount).to.equal(0);
    });
  });

  describe('The increaseUserMentionsCount function', function() {
    it('should do nothing when conversation not found', function() {
      conversation.mention_count = 0;
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.increaseUserMentionsCount(publicConversation._id);

      expect(chatConversationsStoreService.conversations[0].mention_count).to.equal(conversation.mention_count);
    });

    it('should increase when conversation is not the active conversation', function() {
      chatConversationsStoreService.conversations = [publicConversation, conversation];
      chatConversationsStoreService.setActive(conversation);
      chatConversationsStoreService.increaseUserMentionsCount(publicConversation._id);

      expect(chatConversationsStoreService.conversations[0].mention_count).to.equal(1);
    });

    it('should not increase when conversation is the active conversation', function() {
      chatConversationsStoreService.conversations = [publicConversation, conversation];
      chatConversationsStoreService.setActive(conversation);
      chatConversationsStoreService.increaseUserMentionsCount(conversation._id);

      expect(chatConversationsStoreService.conversations[1].mention_count).to.equal(0);
    });

    it('should not increase number of user mentions in a confidential conversation', function() {
      conversation.type = CHAT_CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.mention_count = 0;
      chatConversationsStoreService.conversations = [publicConversation, conversation];
      chatConversationsStoreService.setActive(publicConversation);
      chatConversationsStoreService.increaseUserMentionsCount(conversation._id);

      expect(chatConversationsStoreService.conversations[1].mention_count).to.equal(conversation.mention_count);
    });
  });

  describe('The isInactiveOpenRoom', function() {
    it('should be true with if the the open conversation is not active, otherwise return false', function() {
      chatConversationsStoreService.conversations = [publicConversation, confidentialConversation];
      chatConversationsStoreService.setActive(confidentialConversation);

      expect(chatConversationsStoreService.isInactiveOpenRoom(publicConversation)).to.be.true;
      expect(chatConversationsStoreService.isInactiveOpenRoom(confidentialConversation)).to.be.false;
    });

    it('should be false if the open conversation is active', function() {
      chatConversationsStoreService.conversations = [publicConversation, confidentialConversation];
      chatConversationsStoreService.setActive(publicConversation);

      expect(chatConversationsStoreService.isInactiveOpenRoom(publicConversation)).to.be.false;
      expect(chatConversationsStoreService.isInactiveOpenRoom(confidentialConversation)).to.be.false;
    });
  });

  describe('The isActiveRoom function', function() {
    it('should return false when conversationId is null', function() {
      expect(chatConversationsStoreService.isActiveRoom()).to.be.false;
    });

    it('should return true when input is equal to the activeRoom id', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.setActive(publicConversation);

      expect(chatConversationsStoreService.isActiveRoom(publicConversation._id)).to.be.true;
    });

    it('should return false when input is not equal to the activeRoom id', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.setActive(publicConversation);

      expect(chatConversationsStoreService.isActiveRoom(conversation._id)).to.be.false;
    });
  });

  describe('The joinConversation function', function() {
    it('should do nothing when conversation is null', function() {
      chatConversationsStoreService.joinConversation();

      expect(chatConversationsStoreService.conversations).to.deep.equal([]);
    });

    it('should set the member_status and add the conversation to the store', function() {
      chatConversationsStoreService.joinConversation(conversation);

      expect(chatConversationsStoreService.conversations).to.deep.equal([{_id: conversation._id, name: conversation.name, member_status: CHAT_MEMBER_STATUS.MEMBER}]);
    });
  });

  describe('The leaveConversation function', function() {
    it('should delete the conversation from the store', function() {
      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.channels = [publicConversation];
      chatConversationsStoreService.leaveConversation(publicConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.channels).to.deep.equals([]);
    });
  });

  describe('The markAllMessagesAsRead function', function() {
    it('should set unreadMessageCount to 0', function() {
      conversation.unreadMessageCount = 2;
      confidentialConversation.unreadMessageCount = 3;
      chatConversationsStoreService.conversations = [conversation, publicConversation, confidentialConversation];
      chatConversationsStoreService.channels = [publicConversation];
      chatConversationsStoreService.privateConversations = [confidentialConversation];

      chatConversationsStoreService.markAllMessagesAsRead(conversation);

      expect(conversation.unreadMessageCount).to.equal(0);
      expect(confidentialConversation.unreadMessageCount).to.equal(3);
    });
  });

  describe('The setActive function', function() {
    it('should return false when conversation is undefined', function() {
      expect(chatConversationsStoreService.setActive()).to.be.false;
    });

    it('should return true when already active room and do not change counters', function() {
      chatConversationsStoreService.setActive(conversation);
      conversation.unreadMessageCount = 3;
      conversation.mention_count = 10;

      expect(chatConversationsStoreService.setActive(conversation)).to.be.true;
      expect(conversation).to.shallowDeepEqual({unreadMessageCount: 3, mention_count: 10});
    });

    it('should reuse cached conversation instead of input one', function() {
      var keep = 'keepme';
      var newConversation = {_id: conversation._id, foo: 'bar'};

      conversation.keep = keep;
      chatConversationsStoreService.setActive(conversation);

      expect(chatConversationsStoreService.setActive(newConversation)).to.be.true;
      expect(chatConversationsStoreService.activeRoom.keep).to.equal(keep);
      expect(chatConversationsStoreService.activeRoom.foo).to.not.be.defined;
    });

    it('should set activeRoom to the given one, reset unreads and mentions', function() {
      conversation.unreadMessageCount = 3;
      conversation.mention_count = 10;
      chatConversationsStoreService.conversations = [conversation, publicConversation];

      expect(chatConversationsStoreService.setActive(conversation)).to.be.true;
      expect(chatConversationsStoreService.activeRoom).to.deep.equal(conversation);
      expect(conversation.unreadMessageCount).to.equal(0);
      expect(conversation.mention_count).to.equal(0);
    });
  });

  describe('The unsubscribePrivateConversation function', function() {
    it('should do nothing when the conversation does not exists', function() {
      chatConversationsStoreService.conversations = [conversation, confidentialConversation];
      chatConversationsStoreService.privateConversations = [confidentialConversation];
      chatConversationsStoreService.unsubscribePrivateConversation(publicConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation, confidentialConversation]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([confidentialConversation]);
    });

    it('should remove conversation from conversations and privateConversations and update the subscribed conversations', function() {
      chatConversationsStoreService.conversations = [conversation, confidentialConversation];
      chatConversationsStoreService.privateConversations = [confidentialConversation];
      chatConversationsStoreService.unsubscribePrivateConversation(confidentialConversation);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.privateConversations).to.deep.equals([]);
      expect(chatPrivateConversationService.store).to.have.been.called;
    });
  });

  describe('The updateConversation function', function() {
    it('should add conversation as is when not already in store', function() {
      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.updateConversation(publicConversation);

      expect(chatConversationsStoreService.conversations.length).to.equal(2);
      expect(chatConversationsStoreService.channels).to.deep.equal([publicConversation]);
    });

    it('should update existing conversation attributes', function() {
      var updateConversation = {_id: publicConversation._id, name: 'My new name', members: members, avatar: 'New avatar'};

      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.channels = [publicConversation];
      chatConversationsStoreService.updateConversation(updateConversation);

      expect(chatConversationsStoreService.channels).to.shallowDeepEqual([
        {
          _id: publicConversation._id,
          name: updateConversation.name,
          members: updateConversation.members,
          avatar: updateConversation.avatar
        }
      ]);
    });
  });

  describe('The updateTopic function', function() {
    it('should not add the conversation if not in store', function() {
      var topic = {value: 'My new topic'};

      chatConversationsStoreService.conversations = [conversation];
      chatConversationsStoreService.updateTopic(publicConversation, topic);

      expect(chatConversationsStoreService.conversations).to.deep.equals([conversation]);
      expect(chatConversationsStoreService.conversations[0].topic).to.not.equals(topic);
    });

    it('should update the topic of the conversation', function() {
      var topic = {value: 'My new topic'};

      chatConversationsStoreService.conversations = [conversation, publicConversation];
      chatConversationsStoreService.channels = [publicConversation];
      chatConversationsStoreService.updateTopic(publicConversation, topic);

      expect(chatConversationsStoreService.channels).to.shallowDeepEqual([
        {
          _id: publicConversation._id,
          name: publicConversation.name,
          topic: topic
        }
      ]);
    });
  });
});
