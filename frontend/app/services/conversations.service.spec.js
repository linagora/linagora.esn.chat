'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversationsServices', function() {
  var $q,
  chatConversationsService,
  CHAT_NAMESPACE,
  CHAT_CONVERSATION_TYPE,
  CHAT_EVENTS,
  sessionMock,
  user,
  livenotificationMock,
  chatNamespace,
  $httpBackend,
  $rootScope,
  conversationsServiceMock,
  groups,
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

    conversationsServiceMock = {
      getChannels: function() {
        return $q.when(channels.slice(0));
      },
      getPrivateConversations: function() {
        return $q.when(groups);
      }
    };

    function livenotificationFactory(CHAT_NAMESPACE) {
      livenotificationMock = function(name) {
        if (name === CHAT_NAMESPACE) {
          return chatNamespace;
        } else {
          throw new Error(name + 'namespace has not been mocked', CHAT_NAMESPACE);
        }
      };

      return livenotificationMock;
    }

    module('linagora.esn.chat', function($provide) {
      $provide.factory('session', function($q) {
        sessionMock.ready = $q.when({user: user});
        return sessionMock;
      });
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _chatConversationsService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _$httpBackend_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    chatConversationsService = _chatConversationsService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $httpBackend =  _$httpBackend_;
    $rootScope = _$rootScope_;
    sessionMock.ready = $q.when({user: user});
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL}];
  }));

  it('it should listen for comversation deletion and update cache correctly', function() {
    $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(channels);
    $rootScope.$digest();
    $httpBackend.flush();
    expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.CONVERSATION_DELETION, sinon.match.func.and(sinon.match(function(callback) {
      callback('channel1');
      var thenSpy = sinon.spy();

      chatConversationsService.getChannels().then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(sinon.match({length: 1, 0: channels[1]}));

      return true;
    })));
  });

  describe('getConversationNamePromise', function() {
    var getConversationName;

    beforeEach(function() {
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(channels);
      chatConversationsService.getConversationNamePromise.then(function(gcn) {
        getConversationName = gcn;
      });
      $rootScope.$digest();
      $httpBackend.flush();
      expect(getConversationName).to.be.a.function;
    });

    it('should use firstname and lastname', function() {
      expect(getConversationName({
        members: [{_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should remove remove user which has the given id', function() {
      expect(getConversationName({
        members: [{_id: 'userId', firstname: 'me', lastname: 'ME'}, {_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should display all user if more than one', function() {
      expect(getConversationName({
        members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id: 3, firstname: 'Kenny', lastname: 'McCormick'}]
      })).to.equal('Eric Cartman, Stan Marsh, Kenny McCormick');
    });

    it('should keep conversation name if it is defined no matter the type of the conversation', function() {
      _.map(CHAT_CONVERSATION_TYPE, function(type) {
        expect(getConversationName({
          name: 'name',
          type: type,
          members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id: 3, firstname: 'Kenny', lastname: 'McCormick'}]
        })).to.equal('name');
      });
    });
  });

  describe('the deleteConversation', function() {
    it('should perform the correct rest request and delete conversation from cache', function() {
      var thenSpyForDelete = sinon.spy();
      var thenSpyForGet = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(channels);
      $httpBackend.flush();
      $httpBackend.expectDELETE('/chat/api/chat/conversations/channel1').respond(204, null);
      chatConversationsService.deleteConversation('channel1').then(thenSpyForDelete);
      $httpBackend.flush();
      chatConversationsService.getChannels().then(thenSpyForGet);
      $rootScope.$digest();
      expect(thenSpyForDelete).to.have.been.calledOnce;
      expect(thenSpyForGet).to.have.been.calledWith(sinon.match({length:1, 0: {_id: 'channel2'}}));
    });
  });

  describe('the leaveConversation', function() {
    it('should perform the correct rest request and delete conversation from cache', function() {
      var thenSpyForDelete = sinon.spy();
      var thenSpyForGet = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(channels);
      $httpBackend.flush();
      $httpBackend.expectDELETE('/chat/api/chat/conversations/channel1/members').respond(204, null);
      chatConversationsService.leaveConversation('channel1').then(thenSpyForDelete);
      $httpBackend.flush();
      chatConversationsService.getChannels().then(thenSpyForGet);
      $rootScope.$digest();
      expect(thenSpyForDelete).to.have.been.calledOnce;
      expect(thenSpyForGet).to.have.been.calledWith(sinon.match({length:1, 0: {_id: 'channel2'}}));
    });
  });

  describe('getConversation', function() {
    it('should fetch data from the rest API if not in cached data', function() {
      var channel = {_id: 'channelId'};
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond([]);
      $httpBackend.expectGET('/chat/api/chat/conversations/channelId').respond(channel);
      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should not fetch data from the rest API if channel is in the cached data', function() {
      var channel = {_id: 'channelId'};
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond([channel]);
      chatConversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should refetch data after the cache has been resetted', function() {
      var channel = {_id: 'channelId', data: 'data1'};
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond([channel]);
      chatConversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      chatConversationsService.resetCache();
      var newChannel = {_id: 'channelId', data: 'data2'};
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond([newChannel]);
      var callback = sinon.spy();
      chatConversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match(newChannel));
    });
  });

  describe('getConversations', function() {
    it('should fetch data from the rest API', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.CHANNEL
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.COMMUNITY
      }, {
        _id: 3,
        type: CHAT_CONVERSATION_TYPE.PRIVATE
      }];
      var callback = sinon.spy();

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(conversations);
      chatConversationsService.getConversations().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
        1: conversations[1],
        2: conversations[2],
        length: 3
      }));
    });
  });

  describe('getChannels', function() {
    it('should fetch data from the rest API', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.CHANNEL
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.PRIVATE
      }];
      var callback = sinon.spy();

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(conversations);
      chatConversationsService.getChannels().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
        length: 1
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retrieve', function() {
      var conversations = [{
        _id: 1,
        type: CHAT_CONVERSATION_TYPE.CHANNEL
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.PRIVATE
      }];
      var callback = sinon.spy();

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(conversations);
      chatConversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

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
        type: CHAT_CONVERSATION_TYPE.CHANNEL
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.PRIVATE
      }];
      var callback = sinon.spy();

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(conversations);
      chatConversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      var newConversations = [{
        _id: 42,
        type: CHAT_CONVERSATION_TYPE.CHANNEL
      }, {
        _id: 2,
        type: CHAT_CONVERSATION_TYPE.PRIVATE
      }];

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(newConversations);
      chatConversationsService.resetCache();
      chatConversationsService.getChannels().then(callback);
      $httpBackend.flush();
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
        return {_id: i, type: CHAT_CONVERSATION_TYPE.PRIVATE, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(groups);
      chatConversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1},
        length: 2
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retieve', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.PRIVATE, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(groups);
      chatConversationsService.getPrivateConversations();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      chatConversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1},
        length: 2
      }));
    });

    it('should fetch data from the rest API when data has been cached from the first retieve if reset cache has been called mainwhile', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.PRIVATE, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(groups);
      chatConversationsService.getPrivateConversations();
      $rootScope.$digest();
      $httpBackend.flush();

      var newGroups = [1, 2, 3].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.PRIVATE, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(newGroups);
      chatConversationsService.resetCache();

      var callback = sinon.spy();
      chatConversationsService.getPrivateConversations().then(callback);
      $httpBackend.flush();
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
      var channel = {
        _id: 'channelId'
      };

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond([]);
      $rootScope.$digest();
      $httpBackend.flush();
      $httpBackend.expectPUT('/chat/api/chat/conversations/channelId/topic', {
        value: value,
      }).respond(channel);
      chatConversationsService.updateConversationTopic(value, 'channelId');
      $httpBackend.flush();
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

      $httpBackend.expectGET('/chat/api/chat/user/conversations').respond(channels);
      chatConversationsService.getChannels();
      $httpBackend.flush();
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
