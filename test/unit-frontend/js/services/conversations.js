'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversationsServices', function() {
  var $q,
  conversationsService,
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
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

    conversationsServiceMock = {
      getChannels: function() {
        return $q.when(channels);
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
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _conversationsService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _$httpBackend_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    conversationsService = _conversationsService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $httpBackend =  _$httpBackend_;
    $rootScope = _$rootScope_;
    sessionMock.ready = $q.when({user: user});
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    groups = [{_id: 'group1', type: CHAT_CONVERSATION_TYPE.PRIVATE}, {_id: 'group2', type: CHAT_CONVERSATION_TYPE.PRIVATE}];
    channels = [{_id: 'channel1', type: CHAT_CONVERSATION_TYPE.CHANNEL}, {_id: 'channel2', type: CHAT_CONVERSATION_TYPE.CHANNEL}];
  }));

  describe('computeGroupName', function() {
    it('should use firstname and lastname', function() {
      expect(conversationsService.computeGroupName('userId', {
        members: [{_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should remove remove user which has the given id', function() {
      expect(conversationsService.computeGroupName('userId', {
        members: [{_id: 'userId', firstname: 'me', lastname: 'ME'}, {_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should display all user if more than one', function() {
      expect(conversationsService.computeGroupName('userId', {
        members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id: 3, firstname: 'Kenny', lastname: 'McCormick'}]
      })).to.equal('Eric Cartman, Stan Marsh, Kenny McCormick');
    });
  });

  describe('the deleteConversation', function() {
    it('should perform the correct rest request and delete conversation from cache', function() {
      var thenSpyForDelete = sinon.spy();
      var thenSpyForGet = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(channels);
      $httpBackend.flush();
      $httpBackend.expectDELETE('/chat/api/chat/conversations/channel1').respond(204, null);
      conversationsService.deleteConversation('channel1').then(thenSpyForDelete);
      $httpBackend.flush();
      conversationsService.getChannels().then(thenSpyForGet);
      $rootScope.$digest();
      expect(thenSpyForDelete).to.have.been.calledOnce;
      expect(thenSpyForGet).to.have.been.calledWith(sinon.match({length:1, 0: {_id: 'channel2'}}));
    });
  });

  describe('getConversation', function() {
    it('should fetch data from the rest API if not in cached data', function() {
      var channel = {_id: 'channelId'};
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond([]);
      $httpBackend.expectGET('/chat/api/chat/conversations/channelId').respond(channel);
      conversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should not fetch data from the rest API if channel is in the cached data', function() {
      var channel = {_id: 'channelId'};
      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond([channel]);
      conversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      conversationsService.getConversation('channelId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
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

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(conversations);
      conversationsService.getConversations().then(callback);
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

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(conversations);
      conversationsService.getChannels().then(callback);
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

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(conversations);
      conversationsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      conversationsService.getChannels().then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: conversations[0],
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
      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(groups);
      conversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1, name: '1 1'},
        length: 2
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retieve', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, type: CHAT_CONVERSATION_TYPE.PRIVATE, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(groups);
      conversationsService.getPrivateConversations();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      conversationsService.getPrivateConversations().then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1, name: '1 1'},
        length: 2
      }));
    });
  });

  describe('updateConversationTopic', function() {
    beforeEach(function() {
      sessionMock.user = $q.when({user: user});
    });

    it('should return the channel affected', function() {
      var value = 'Default';
      var channel = {
        _id: 'channelId'
      };

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond([]);
      $httpBackend.expectPUT('/chat/api/chat/conversations/channelId/topic', {
        value: value,
      }).respond(channel);
      conversationsService.updateConversationTopic(value, 'channelId');
      $rootScope.$digest();
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

      $httpBackend.expectGET('/chat/api/chat/me/conversation').respond(channels);
      conversationsService.getChannels();
      $httpBackend.flush();
      conversationsService.setTopicChannel(topic).then(function(isSet) {
        expect(isSet).to.be.equal(true);
      });
      conversationsService.getConversation(topic.channel).then(function(channel) {
        expect(channel.topic).to.be.deep.equal(topic.topic);
      });
    });

    it('should not set the topic for a channel who don\'t exist', function() {
      topic.channel = 'channel3';
      conversationsService.setTopicChannel(topic).then(function(isSet) {
        expect(isSet).to.be.equal(false);
      });
    });
  });
});
