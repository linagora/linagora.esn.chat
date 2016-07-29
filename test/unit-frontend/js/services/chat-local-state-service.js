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
      channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL}];
      groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE}];
      communitys = [{_id: 'community1', type: CHAT_CONVERSATION_TYPE.COMMUNITY}, {_id: 'community2', type: CHAT_CONVERSATION_TYPE.COMMUNITY}];
      conversations = channels.concat(groups).concat(communitys);

      conversationsServiceMock = {
        getConversations: function() {
          return $q.when(conversations);
        }
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
    chatLocalStateService.conversations = conversations;
    chatLocalStateService.channels = channels;
    chatLocalStateService.communityConversations = communitys;
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

  describe('unreadMessage', function() {

    it('should upgrade messageCount of channel', function() {
      chatLocalStateService.unreadMessage({channel: 'channel1'});
      chatLocalStateService.unreadMessage({channel: 'channel1'});
      expect(channels[0].unreadMessageCount).to.equal(2);
    });

    it('should upgrade messageCount of group', function() {
      chatLocalStateService.unreadMessage({channel: 'group2'});
      chatLocalStateService.unreadMessage({channel: 'group2'});
      expect(groups[1].unreadMessageCount).to.equal(2);
    });

    it('should not upgrade messageCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      chatLocalStateService.setActive('channel1');
      chatLocalStateService.unreadMessage({channel: 'channel1'});
      expect(channels[0].unreadMessageCount).to.equal(0);
    });

    it('should upgrade mentionCount of channel', function() {
      chatLocalStateService.unreadMessage({channel: 'channel1', text: '@userId salut'});
      chatLocalStateService.unreadMessage({channel: 'channel1'});
      expect(channels[0].unreadMessageCount).to.equal(2);
      expect(channels[0].mentionCount).to.be.equal(1);
    });

    it('should upgrade mentionCount of group', function() {
      chatLocalStateService.unreadMessage({channel: 'group2', text: '@userId salut'});
      chatLocalStateService.unreadMessage({channel: 'group2'});
      expect(groups[1].unreadMessageCount).to.equal(2);
      expect(groups[1].mentionCount).to.be.equal(1);
    });

    it('should not upgrade mentionCount of active group or channel', function() {
      channels[0].unreadMessageCount = 1;
      channels[0].mentionCount = 1;
      chatLocalStateService.setActive('channel1');
      chatLocalStateService.unreadMessage({channel: 'channel1', text: '@userId salut'});
      expect(channels[0].unreadMessageCount).to.equal(0);
      expect(channels[0].mentionCount).to.be.equal(0);
    });

    it('should not fail if channel does not exist', function() {
      chatLocalStateService.unreadMessage({_id: 'channel42'});
    });
  });

  describe('add conversation', function() {

    it('should add a channel', function() {
      var channel = {_id: 'channel3', type: CHAT_CONVERSATION_TYPE.CHANNEL};
      chatLocalStateService.addConversation(channel);
      expect(chatLocalStateService.channels).to.include(channel);
      expect(chatLocalStateService.conversations).to.include(channel);
    });

    it('should add a private conversation', function() {
      var privateConversation = {_id: 'group3', type: CHAT_CONVERSATION_TYPE.PRIVATE};
      chatLocalStateService.addConversation(privateConversation);
      expect(chatLocalStateService.privateConversations).to.include(privateConversation);
      expect(chatLocalStateService.conversations).to.include(privateConversation);
    });

    it('should add a community', function() {
      var communityConversation = {_id: 'group3', type: CHAT_CONVERSATION_TYPE.COMMUNITY};
      chatLocalStateService.addConversation(communityConversation);
      expect(chatLocalStateService.communityConversations).to.include(communityConversation);
      expect(chatLocalStateService.conversations).to.include(communityConversation);
    });

    it('should do nothing if conversation existed', function() {
      var conversation = {_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE};
      var oldGroups = groups.slice(0);
      chatLocalStateService.addConversation(conversation);
      expect(groups).to.be.deep.equal(oldGroups);
    });

    it('should insert in the correct order', function() {
      chatLocalStateService.conversations = [];
      var conv1 = {_id: '1', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 9e9}};

      var conv2 = {_id: '2', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 6e9}};

      var conv3 = {_id: '3', type: CHAT_CONVERSATION_TYPE.PRIVATE, last_message: {date: new Date() + 3e9}};

      [conv1, conv2, conv3].forEach(chatLocalStateService.addConversation);

      expect(chatLocalStateService.conversations).to.deep.equals([conv3, conv2, conv1]);
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
      var data = {_id: id, type: CHAT_CONVERSATION_TYPE.CHANNEL, last_message: {date: new Date() + 10e9}};
      callback(data);
      expect(chatLocalStateService.channels[0]).to.equals(data);
      expect(chatLocalStateService.conversations[0]).to.deep.equals(data);
    });
  });
});
