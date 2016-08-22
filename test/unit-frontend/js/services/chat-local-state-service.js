'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('chatLocalState service', function() {
  var chatLocalStateService, CHAT_CONVERSATION_TYPE, CHAT_DEFAULT_CHANNEL, $rootScope, channels, CHAT_EVENTS, groups, communitys, conversations, sessionMock, user, chatNamespace, conversationsServiceMock, $q, $httpBackend;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
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

    chatNamespace = {on: sinon.spy()};

    function livenotificationFactory(CHAT_NAMESPACE) {
      return function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        } else {
          throw new Error(name + 'namespace has not been mocked');
        }
      };
    }

    function conversationsServiceFactory(CHAT_CONVERSATION_TYPE) {
      channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL, numOfReadedMessage: {}}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL, numOfReadedMessage: {}}];
      groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE, numOfReadedMessage: {}}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE, numOfReadedMessage: {}}];
      communitys = [{_id: 'community1', type: CHAT_CONVERSATION_TYPE.COMMUNITY, numOfReadedMessage: {}}, {_id: 'community2', type: CHAT_CONVERSATION_TYPE.COMMUNITY, numOfReadedMessage: {}}];
      conversations = channels.concat(groups).concat(communitys);

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
        })
      };

      return conversationsServiceMock;
    }

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.factory('conversationsService', conversationsServiceFactory);
    });

  });

  beforeEach(angular.mock.inject(function(_chatLocalStateService_, _CHAT_CONVERSATION_TYPE_, _CHAT_DEFAULT_CHANNEL_, _$rootScope_, _CHAT_EVENTS_, _$q_, _$httpBackend_) {
    chatLocalStateService = _chatLocalStateService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    CHAT_DEFAULT_CHANNEL = _CHAT_DEFAULT_CHANNEL_;
    $rootScope = _$rootScope_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $q = _$q_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(function() {
    chatLocalStateService.initLocalState();
    $rootScope.$digest();
    chatLocalStateService.conversations = conversations.slice(0);
    chatLocalStateService.channels = channels.slice(0);
    chatLocalStateService.communityConversations = communitys.slice(0);
    chatLocalStateService.privateConversations = groups.slice(0);
  });

  describe('setActive', function() {

    it('should set activeRoom the channel and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      var isSet = chatLocalStateService.setActive(channels[0]._id);

      expect(chatLocalStateService.activeRoom).to.be.deep.equal(channels[0]);
      expect(isSet).to.be.equal(true);
      expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channels[0]);
    });

    it('should set activeRoom the group channel and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      var isSet = chatLocalStateService.setActive(groups[1]._id);

      expect(chatLocalStateService.activeRoom).to.be.deep.equal(groups[1]);
      expect(isSet).to.be.equal(true);
      expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, groups[1]);
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

    it('should upgrade messageCount of channel', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(2);
    });

    it('should upgrade messageCount of group', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', timestamps: {creation: new Date()}});
      expect(groups[1].unreadMessageCount).to.equal(2);
    });

    it('should not upgrade messageCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      chatLocalStateService.setActive('channel1');
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(0);
    });

    it('should upgrade mentionCount of channel', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'channel1', timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'channel1', timestamps: {creation: new Date()}});
      expect(channels[0].unreadMessageCount).to.equal(2);
      expect(channels[0].mentionCount).to.be.equal(1);
    });

    it('should upgrade mentionCount of group', function() {
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'group2', timestamps: {creation: new Date()}});
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {channel: 'group2', timestamps: {creation: new Date()}});
      $rootScope.$digest();
      expect(groups[1].unreadMessageCount).to.equal(2);
      expect(groups[1].mentionCount).to.be.equal(1);
    });

    it('should not upgrade mentionCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      channels[0].mentionCount = 1;
      chatLocalStateService.setActive('channel1');
      $rootScope.$broadcast(CHAT_EVENTS.TEXT_MESSAGE, {text: '@userId salut', channel: 'channel1', timestamps: {creation: new Date()}});
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

  describe('add conversation', function() {

    it('should add a channel', function() {
      var channel = {_id: 'channel3', type: CHAT_CONVERSATION_TYPE.CHANNEL, numOfReadedMessage: {}};
      chatLocalStateService.addConversation(channel);
      expect(chatLocalStateService.channels).to.include(channel);
      expect(chatLocalStateService.conversations).to.include(channel);
    });

    it('should add a private conversation', function() {
      var privateConversation = {_id: 'group3', type: CHAT_CONVERSATION_TYPE.PRIVATE, numOfReadedMessage: {}};
      chatLocalStateService.addConversation(privateConversation);
      expect(chatLocalStateService.privateConversations).to.include(privateConversation);
      expect(chatLocalStateService.conversations).to.include(privateConversation);
    });

    it('should add a community', function() {
      var communityConversation = {_id: 'group3', type: CHAT_CONVERSATION_TYPE.COMMUNITY, numOfReadedMessage: {}};
      chatLocalStateService.addConversation(communityConversation);
      expect(chatLocalStateService.communityConversations).to.include(communityConversation);
      expect(chatLocalStateService.conversations).to.include(communityConversation);
    });

    it('should do nothing if conversation existed', function() {
      var conversation = {_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE, numOfReadedMessage: {}};
      var oldGroups = groups.slice(0);
      chatLocalStateService.addConversation(conversation);
      expect(groups).to.be.deep.equal(oldGroups);
    });

    it('should insert in the correct order', function() {
      chatLocalStateService.conversations = [];
      var conv1 = {_id: '1', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 9e9}, numOfReadedMessage: {}};

      var conv2 = {_id: '2', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 6e9}, numOfReadedMessage: {}};

      var conv3 = {_id: '3', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 3e9}, numOfReadedMessage: {}};

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

    it('should correctly delete communityConversation conversation', function() {
      chatLocalStateService.deleteConversation(communitys[0]);
      $rootScope.$digest();
      conversations.splice(4, 1);
      expect(chatLocalStateService.conversations).to.deep.equals(conversations);
      expect(chatLocalStateService.communityConversations).to.deep.equals(communitys.slice(1));
    });

    it('should correctly call conversationsService.deleteConversation', function() {
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

    it('should correctly leave communityConversation conversation', function() {
      chatLocalStateService.leaveConversation(communitys[0]);
      $rootScope.$digest();
      conversations.splice(4, 1);
      expect(chatLocalStateService.conversations).to.deep.equals(conversations);
      expect(chatLocalStateService.communityConversations).to.deep.equals(communitys.slice(1));
    });

    it('should correctly call conversationsService.leaveConversation', function() {
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
      var id =  'justAdded';
      var data = {_id: id, type: CHAT_CONVERSATION_TYPE.CHANNEL, last_message: {date: new Date() + 10e9}, numOfReadedMessage: {}};
      callback(data);
      expect(chatLocalStateService.channels[0]).to.equals(data);
      expect(chatLocalStateService.conversations[0]).to.deep.equals(data);
    });
  });
});
