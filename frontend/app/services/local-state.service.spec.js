'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatLocalState service', function() {
  var chatLocalStateService, chatConversationService, chatConversationMock, chatUsernameMock, CHAT_CONVERSATION_TYPE, $rootScope, channels, CHAT_EVENTS, groups, conversations, sessionMock, user, chatNamespace, conversationsServiceMock, $q;

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    })
  );

  beforeEach(function() {
    user = {_id: 'userId'};

    sessionMock = {
      user: user,
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

    chatUsernameMock = {
      generate: angular.noop
    };

    chatNamespace = {on: sinon.spy()};

    function livenotificationFactory(CHAT_NAMESPACE) {
      return function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        }
        throw new Error(name + 'namespace has not been mocked');
      };
    }

    function conversationsServiceFactory(CHAT_CONVERSATION_TYPE) {
      channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.OPEN, numOfReadedMessage: {}}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.OPEN, numOfReadedMessage: {}}];
      groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, numOfReadedMessage: {}}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, numOfReadedMessage: {}}];
      conversations = channels.concat(groups);

      conversationsServiceMock = {
        getConversations: function() {
          return $q.when(conversations.slice(0));
        },
        markAllMessageReaded: sinon.spy(),
        deleteConversation: sinon.spy(function() {
          return $q.when(null);
        }),
        leaveConversation: sinon.spy(function() {
          return $q.when(null);
        }),
        resetCache: sinon.spy()
      };

      return conversationsServiceMock;
    }

    chatConversationMock = {
      get: sinon.spy()
    };

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.factory('chatConversationsService', conversationsServiceFactory);
      $provide.constant('chatConversationService', chatConversationMock);
      $provide.value('chatUsername', chatUsernameMock);
    });

  });

  beforeEach(angular.mock.inject(function(_chatLocalStateService_, _chatConversationService_, _CHAT_CONVERSATION_TYPE_, _$rootScope_, _CHAT_EVENTS_, _$q_) {
    chatLocalStateService = _chatLocalStateService_;
    chatConversationService = _chatConversationService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    $rootScope = _$rootScope_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(function() {
    chatLocalStateService.initLocalState();
    $rootScope.$digest();
    chatLocalStateService.conversations = conversations.slice(0);
    chatLocalStateService.channels = channels.slice(0);
    chatLocalStateService.privateConversations = groups.slice(0);
  });

  describe('setActive', function() {

    it('should set activeRoom the channel and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      var isSet = chatLocalStateService.setActive(channels[0]._id);

      expect(chatLocalStateService.activeRoom).to.be.deep.equal(channels[0]);
      expect(isSet).to.be.equal(true);
      expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.SET_ACTIVE_ROOM, channels[0]);
    });

    it('should set activeRoom the group channel and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      var isSet = chatLocalStateService.setActive(groups[1]._id);

      expect(chatLocalStateService.activeRoom).to.be.deep.equal(groups[1]);
      expect(isSet).to.be.equal(true);
      expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.SET_ACTIVE_ROOM, groups[1]);
    });

    it('should not set activeRoom a channel who don\'t exist', function() {
      $rootScope.$broadcast = sinon.spy();
      var isSet = chatLocalStateService.setActive('channel3');

      expect(chatLocalStateService.activeRoom).to.not.be.deep.equal({_id: 'channel3'});
      expect(isSet).to.be.equal(false);
    });
  });

  describe('initLocalState', function() {
    it('should initialize the channels/groups and the activeRoom/activeRoom', function() {
      chatLocalStateService.initLocalState();
      expect(chatLocalStateService.activeRoom).to.be.deep.equal({});
    });
  });

  describe('should count unread message when receiving a message that is not on the current channel', function() {

    var user = {
      _id: 'userId',
      firstname: 'user',
      lastname: 'user'
    };

    it('should upgrade messageCount of channel', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(2);
    });

    it('should upgrade messageCount of group', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', creator: user, timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', creator: user, timestamps: {creation: new Date()}});
      expect(groups[1].unreadMessageCount).to.equal(2);
    });

    it('should not upgrade messageCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      chatLocalStateService.setActive('channel1');
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(0);
    });

    it('should upgrade mentionCount of channel', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(2);
      expect(channels[0].mentionCount).to.be.equal(1);
    });

    it('should upgrade mentionCount of group', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'group2', creator: user, timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', creator: user, timestamps: {creation: new Date()}});
      $rootScope.$digest();
      expect(groups[1].unreadMessageCount).to.equal(2);
      expect(groups[1].mentionCount).to.be.equal(1);
    });

    it('should not upgrade mentionCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      channels[0].mentionCount = 1;
      chatLocalStateService.setActive('channel1');
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'channel1', creator: user, timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(0);
      expect(channels[0].mentionCount).to.be.equal(0);
    });

    it('should not fail if channel does not exist', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel42', timestamps: {creation: new Date()}});
    });
  });

  describe('getNumberOfUnreadedMessages function', function() {
    it('should send a function that sends the number of unreaded messages on all conversation', function() {
      channels[0].numOfReadedMessage.numOfMessage = 2;
      channels[0].unreadMessageCount = 1;
      channels[1].numOfReadedMessage.numOfMessage = 2;
      channels[1].unreadMessageCount = 1;
      expect(chatLocalStateService.getNumberOfUnreadedMessages()).to.equal(2);
    });

    it('should send a function that sends the number of unreaded messages after activating the chat', function() {
      channels[0].numOfReadedMessage.numOfMessage = 2;
      channels[0].unreadMessageCount = 1;
      channels[1].numOfReadedMessage.numOfMessage = 2;
      channels[1].unreadMessageCount = 1;
      expect(chatLocalStateService.getNumberOfUnreadedMessages()).to.equal(2);

      chatLocalStateService.setActive('channel1');
      expect(chatLocalStateService.getNumberOfUnreadedMessages()).to.equal(1);
    });
  });

  describe('should set the last_message when receiving a message', function() {

    var user = {
      _id: 'userId',
      firstname: 'user',
      lastname: 'user'
    };

    it('set last_message of the channel', function() {
      var message = {channel: 'group2', text: 'text', creator: user, timestamps: {creation: new Date()}};

      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, message);
      expect(groups[1].last_message.creator).to.be.deep.equal(user);
      expect(groups[1].last_message.text).to.be.equal(message.text);
    });
  });

  describe('add conversation', function() {

    it('should add a channel', function() {
      var channel = {_id: 'channel3', type: CHAT_CONVERSATION_TYPE.OPEN, numOfReadedMessage: {}};

      chatLocalStateService.addConversation(channel);
      expect(chatLocalStateService.channels).to.include(channel);
      expect(chatLocalStateService.conversations).to.include(channel);
    });

    it('should add a private conversation', function() {
      var privateConversation = {_id: 'group3', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, numOfReadedMessage: {}};

      chatLocalStateService.addConversation(privateConversation);
      expect(chatLocalStateService.privateConversations).to.include(privateConversation);
      expect(chatLocalStateService.conversations).to.include(privateConversation);
    });

    it('should do nothing if conversation existed', function() {
      var conversation = {_id: 'group1', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, numOfReadedMessage: {}};
      var oldGroups = groups.slice(0);

      chatLocalStateService.addConversation(conversation);
      expect(groups).to.be.deep.equal(oldGroups);
    });

    it('should insert in the correct order', function() {
      chatLocalStateService.conversations = [];
      var conv1 = {_id: '1', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, last_message: {date: new Date() + 9e9}, numOfReadedMessage: {}};
      var conv2 = {_id: '2', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, last_message: {date: new Date() + 6e9}, numOfReadedMessage: {}};
      var conv3 = {_id: '3', type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, last_message: {date: new Date() + 3e9}, numOfReadedMessage: {}};

      [conv1, conv2, conv3].forEach(chatLocalStateService.addConversation);

      expect(chatLocalStateService.conversations).to.deep.equals([conv3, conv2, conv1]);
    });
  });

  describe('delete conversation', function() {
    it('should correctly delete channel', function() {
      chatLocalStateService.deleteConversation(channels[0]);
      $rootScope.$digest();
      expect(chatLocalStateService.conversations).to.deep.equals(conversations.slice(1));
      expect(chatLocalStateService.channels).to.deep.equals(channels.slice(1));
    });

    it('should correctly delete private conversation', function() {
      chatLocalStateService.deleteConversation(groups[0]);
      $rootScope.$digest();
      conversations.splice(2, 1);
      expect(chatLocalStateService.conversations).to.deep.equals(conversations);
      expect(chatLocalStateService.privateConversations).to.deep.equals(groups.slice(1));
    });

    it('should correctly call chatConversationsService.deleteConversation', function() {
      var thenSpy = sinon.spy();

      chatLocalStateService.deleteConversation(channels[1]).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledOnce;
      expect(conversationsServiceMock.deleteConversation).to.have.been.calledWith(channels[1]._id);
    });
  });

  describe('leave conversation', function() {
    it('should correctly leave channel', function() {
      chatLocalStateService.leaveConversation(channels[0]);
      $rootScope.$digest();
      expect(chatLocalStateService.conversations).to.deep.equals(conversations.slice(1));
      expect(chatLocalStateService.channels).to.deep.equals(channels.slice(1));
    });

    it('should correctly leave private conversation', function() {
      chatLocalStateService.leaveConversation(groups[0]);
      $rootScope.$digest();
      conversations.splice(2, 1);
      expect(chatLocalStateService.conversations).to.deep.equals(conversations);
      expect(chatLocalStateService.privateConversations).to.deep.equals(groups.slice(1));
    });

    it('should correctly call chatConversationsService.leaveConversation', function() {
      var thenSpy = sinon.spy();

      chatLocalStateService.leaveConversation(channels[1]).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledOnce;
      expect(conversationsServiceMock.leaveConversation).to.have.been.calledWith(channels[1]._id);
    });
  });

  describe('isActiveRoom', function() {

    it('should return true if channel is the active channel', function() {
      chatLocalStateService.setActive(channels[0]._id);
      var isActive = chatLocalStateService.isActiveRoom(channels[0]._id);

      expect(isActive).to.be.equal(true);
    });

    it('should return false if channel is not the active channel', function() {
      chatLocalStateService.setActive(channels[0]._id);
      var isActive = chatLocalStateService.isActiveRoom(channels[1]._id);

      expect(isActive).to.be.equal(false);
    });
  });

  describe('websocketListener', function() {

    var callback;

    function initCache() {
      chatLocalStateService.initLocalState();
    }

    beforeEach(function() {
      initCache();

      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CONVERSATION, sinon.match.func.and(function(_callback_) {
        callback = _callback_;

        return true;
      }));
    });

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CONVERSATION and add regular channel in channel cache', function() {
      var id = 'justAdded';
      var data = {_id: id, type: CHAT_CONVERSATION_TYPE.OPEN, last_message: {date: new Date() + 10e9}, numOfReadedMessage: {}};

      callback(data);
      expect(chatLocalStateService.channels[0]).to.equals(data);
      expect(chatLocalStateService.conversations[0]).to.deep.equals(data);
    });
  });

  describe('updateConversation function', function() {

    function initCache() {
      chatLocalStateService.initLocalState();
    }

    beforeEach(initCache);

    it('should not fail when conversation does not exists', function() {
      var thenSpy = sinon.spy();

      chatLocalStateService.updateConversation().then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledOnce;
    });

    it('should update the conversation with chatConversationService.get data', function(done) {
      var id = 'updateMe';
      var conversation = {
        _id: id,
        name: 'My conversation',
        members: [1, 2, 3],
        avatar: 'image.png'
      };

      chatLocalStateService.conversations = [{_id: id}];
      chatConversationService.get = sinon.spy(function() {
        return $q.when(conversation);
      });

      chatLocalStateService.updateConversation(id).then(function(result) {
        expect(result).to.shallowDeepEqual(conversation);
        done();
      }, done);
      $rootScope.$digest();
    });
  });
});
