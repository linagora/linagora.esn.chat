'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversationsServices', function() {
  var $q,
  chatConversationsService,
  CHAT_CONVERSATION_TYPE,
  CHAT_EVENTS,
  sessionMock,
  user,
  livenotificationMock,
  chatNamespace,
  chatConversationService,
  $rootScope,
  channels;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    user = {_id: 'userId'};

    chatNamespace = {
      on: sinon.spy()
    };

    sessionMock = {
      ready: null
    };

    chatConversationService = {};

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
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationService', chatConversationService);
      $provide.factory('session', function($q) {
        sessionMock.ready = $q.when({user: user});

        return sessionMock;
      });
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _chatConversationsService_, _CHAT_EVENTS_, _$rootScope_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    chatConversationsService = _chatConversationsService_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    sessionMock.ready = $q.when({user: user});
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.OPEN}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.OPEN}];
  }));

  it('it should listen for conversation deletion and update cache correctly', function() {
    chatConversationService.listForCurrentUser = function() {
      return $q.when({data: channels});
    };
    $rootScope.$digest();

    expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.CONVERSATION_DELETION, sinon.match.func.and(sinon.match(function(callback) {
      callback('channel1');
      var thenSpy = sinon.spy();

      chatConversationsService.getChannels().then(thenSpy);
      $rootScope.$digest();

      expect(thenSpy).to.have.been.calledWith(sinon.match({length: 1, 0: {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.OPEN}}));

      return true;
    })));
  });

  describe('the deleteConversation', function() {
    it('should perform the correct rest request and delete conversation from cache', function() {
      var thenSpyForDelete = sinon.spy();
      var thenSpyForGet = sinon.spy();

      chatConversationService.listForCurrentUser = function() {
        return $q.when({data: channels});
      };

      chatConversationService.remove = sinon.spy(function() {
        return $q.when();
      });

      chatConversationsService.deleteConversation('channel1').then(thenSpyForDelete);
      $rootScope.$digest();

      chatConversationsService.getChannels().then(thenSpyForGet);
      $rootScope.$digest();

      expect(chatConversationService.remove).to.have.been.calledOnce;
      expect(thenSpyForDelete).to.have.been.calledOnce;
      expect(thenSpyForGet).to.have.been.calledWith(sinon.match({length: 1, 0: {_id: 'channel2'}}));
    });
  });

  describe('the leaveConversation', function() {
    it('should perform the correct rest request and delete conversation from cache', function() {
      var thenSpyForDelete = sinon.spy();
      var thenSpyForGet = sinon.spy();

      sessionMock.user = user;

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: channels});
      });

      chatConversationService.leave = sinon.spy(function() {
        return $q.when();
      });

      chatConversationsService.leaveConversation('channel1').then(thenSpyForDelete);
      $rootScope.$digest();
      chatConversationsService.getChannels().then(thenSpyForGet);
      $rootScope.$digest();

      expect(chatConversationService.leave).to.have.been.calledOnce;
      expect(chatConversationService.listForCurrentUser).to.have.been.calledOnce;
      expect(thenSpyForDelete).to.have.been.calledOnce;
      expect(thenSpyForGet).to.have.been.calledWith(sinon.match({length: 1, 0: {_id: 'channel2'}}));
    });
  });

  describe('getConversation', function() {
    it('should fetch data from the rest API if not in cached data', function() {
      var channel = {_id: 'channelId'};
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: []});
      });

      chatConversationService.get = sinon.spy(function() {
        return $q.when({data: channel});
      });

      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();

      expect(chatConversationService.listForCurrentUser).to.have.been.calledOnce;
      expect(chatConversationService.get).to.have.been.calledWith('channelId');
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should not fetch data from the rest API if channel is in the cached data', function() {
      var channel = {_id: 'channelId'};

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: [channel]});
      });

      chatConversationsService.getChannels();
      $rootScope.$digest();

      var callback = sinon.spy();

      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      expect(chatConversationService.listForCurrentUser).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should refetch data after the cache has been resetted', function() {
      var channel = {_id: 'channelId', data: 'data1', type: CHAT_CONVERSATION_TYPE.OPEN};
      var newChannel = {_id: 'channelId', data: 'data2', type: CHAT_CONVERSATION_TYPE.OPEN};
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.stub();
      chatConversationService.listForCurrentUser.onCall(0).returns($q.when({data: [channel]}));
      chatConversationService.listForCurrentUser.onCall(1).returns($q.when({data: [newChannel]}));

      chatConversationsService.getChannels();
      $rootScope.$digest();

      chatConversationsService.resetCache();

      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match(newChannel));
      expect(chatConversationService.listForCurrentUser).to.have.been.calledTwice;
    });
  });

  describe('getConversations', function() {
    it('should fetch data from the rest API', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.OPEN
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL
      }];
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: conversations});
      });
      chatConversationsService.getConversations().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
        1: conversations[1],
        length: 2
      }));
    });
  });

  describe('getChannels', function() {
    it('should fetch data from the rest API', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.OPEN
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL
      }];
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: conversations});
      });

      chatConversationsService.getChannels().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
        length: 1
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retrieve', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.OPEN
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL
      }];
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: conversations});
      });

      chatConversationsService.getChannels();
      $rootScope.$digest();

      chatConversationsService.getChannels().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
        length: 1
      }));
    });

    it('should fetch data from the rest API when data has been cached from the first retrieve and if resetCache has been called mainwhile', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.OPEN
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL
      }];
      var newConversations = [{
        _id: 42,
        type: CHAT_CONVERSATION_TYPE.OPEN
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL
      }];
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.stub();
      chatConversationService.listForCurrentUser.onCall(0).returns($q.when({data: conversations}));
      chatConversationService.listForCurrentUser.onCall(1).returns($q.when({data: newConversations}));

      chatConversationsService.getChannels();
      $rootScope.$digest();

      chatConversationsService.resetCache();
      chatConversationsService.getChannels().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match({
        0: newConversations[0],
        length: 1
      }));
    });
  });

  describe('getPrivateConversations', function() {
    it('should fetch data from the rest API the first time', function() {
      sessionMock.ready = $q.when({user: user});
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: groups});
      });

      chatConversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1},
        length: 2
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retieve', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: groups});
      });

      chatConversationsService.getPrivateConversations();
      $rootScope.$digest();

      chatConversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1},
        length: 2
      }));
    });

    it('should fetch data from the rest API when data has been cached from the first retieve if reset cache has been called mainwhile', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var newGroups = [1, 2, 3].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.CONFIDENTIAL, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var callback = sinon.spy();

      chatConversationService.listForCurrentUser = sinon.stub();
      chatConversationService.listForCurrentUser.onCall(0).returns($q.when({data: groups}));
      chatConversationService.listForCurrentUser.onCall(1).returns($q.when({data: newGroups}));

      chatConversationsService.getPrivateConversations();
      $rootScope.$digest();

      chatConversationsService.resetCache();

      chatConversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();

      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1},
        length: 3
      }));
    });
  });

  describe('updateConversationTopic', function() {
    it('should return the channel affected', function() {
      var value = 'Default';
      var channelId = 'channelId';

      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: []});
      });

      chatConversationService.updateTopic = sinon.spy();

      chatConversationsService.updateConversationTopic(value, channelId);
      $rootScope.$digest();

      expect(chatConversationService.updateTopic).to.have.been.calledWith(channelId, value);
    });
  });

  describe('setTopicChannel', function() {
    var topic;

    beforeEach(function() {
      topic = {
        channel: 'channel1',
        topic: {
          value: 'topic'
        }
      };
    });

    it('should set the topic of a room', function() {
      chatConversationService.listForCurrentUser = sinon.spy(function() {
        return $q.when({data: channels});
      });

      chatConversationsService.setTopicChannel(topic).then(function(isSet) {
        expect(isSet).to.be.equal(true);
      });
      chatConversationsService.getConversation(topic.channel).then(function(channel) {
        expect(channel.topic).to.be.deep.equal(topic.topic);
      });
    });

    it('should not set the topic for a channel who don\'t exist', function() {
      topic.channel = 'channel3';
      chatConversationsService.setTopicChannel(topic).then(function(isSet) {
        expect(isSet).to.be.equal(false);
      });
    });
  });
});
