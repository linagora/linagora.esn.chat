'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat channelsServices', function() {
  var $q,
  channelsService,
  CHAT_NAMESPACE,
  CHAT_EVENTS,
  sessionMock,
  user,
  livenotificationMock,
  chatNamespace,
  $httpBackend,
  $rootScope;

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
      $provide.value('_', _);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _channelsService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _$httpBackend_) {
    $q = _$q_;
    channelsService = _channelsService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $httpBackend =  _$httpBackend_;
    $rootScope = _$rootScope_;
    sessionMock.ready = $q.when({user:user});
  }));

  describe('computeGroupName', function() {
    it('should use firstname and lastname', function() {
      expect(channelsService.computeGroupName('userId', {
        members: [{_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should remove remove user which has the given id', function() {
      expect(channelsService.computeGroupName('userId', {
        members: [{_id: 'userId', firstname: 'me', lastname: 'ME'}, {_id: 'youId', firstname: 'you', lastname: 'YOU'}]
      })).to.equal('you YOU');
    });

    it('should display all user if more than one', function() {
      expect(channelsService.computeGroupName('userId', {
        members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id:3, firstname: 'Kenny', lastname: 'McCormick'}]
      })).to.equal('Eric Cartman, Stan Marsh, Kenny McCormick');
    });
  });

  describe('getChannel', function() {
    it('should fetch data from the rest API if not in cached data', function() {
      var channel = {_id:'channelId'};
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/channels/channelId').respond(channel);
      channelsService.getChannel('channelId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });

    it('should not fetch data from the rest API if channel is in the cached data', function() {
      var channel = {_id:'channelId'};
      $httpBackend.expectGET('/chat/api/chat/channels').respond([channel]);
      channelsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      channelsService.getChannel('channelId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match(channel));
    });
  });

  describe('getChannels', function() {
    it('should fetch data from the rest API', function() {
      var channels = [1, 2, 3];
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/channels').respond(channels);
      channelsService.getChannels().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: 1,
        1: 2,
        2: 3,
        length: 3
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retieve', function() {
      var channels = [1, 2, 3];

      $httpBackend.expectGET('/chat/api/chat/channels').respond(channels);
      channelsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      channelsService.getChannels().then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: 1,
        1: 2,
        2: 3,
        length: 3
      }));
    });
  });

  describe('getGroups', function() {
    it('should fetch data from the rest API the first time', function() {
      sessionMock.ready = $q.when({user:user});
      var groups = [1, 2].map(function(i) {
        return {_id: i, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/me/groups').respond(groups);
      channelsService.getGroups().then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1, name: '1 1'},
        length: 2
      }));
    });

    it('should not fetch data from the rest API when data has been cached from the first retieve', function() {
      var groups = [1, 2].map(function(i) {
        return {_id: i, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
      });

      $httpBackend.expectGET('/chat/api/chat/me/groups').respond(groups);
      channelsService.getGroups();
      $rootScope.$digest();
      $httpBackend.flush();

      var callback = sinon.spy();
      channelsService.getGroups().then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(sinon.match({
        0: {_id: 1, name: '1 1'},
        length: 2
      }));
    });
  });

  describe('websocketListener', function() {

    var callback;

    function initCache() {
      $httpBackend.expectGET('/chat/api/chat/me/groups').respond([]);
      channelsService.getGroups();
      $rootScope.$digest();
      $httpBackend.flush();

      $httpBackend.expectGET('/chat/api/chat/channels').respond([]);
      channelsService.getChannels();
      $rootScope.$digest();
      $httpBackend.flush();
    }

    beforeEach(function() {
      initCache();

      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, sinon.match.func.and(function(_callback_) {
        callback = _callback_;
        return true;
      }));
    });

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CHANNEL and add regular channel in channel cache', function() {
      var id =  'justAdded';
      var data = {_id:id};
      callback(data);
      var thenCallback = sinon.spy();
      channelsService.getChannel(id).then(thenCallback);
      $rootScope.$digest();
      expect(thenCallback).to.have.been.calledWith(data);
    });

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CHANNEL and broadcast channel which are group after having computing her name as it on $rootScope', function() {
      var id =  'justAdded';
      var data = {
        _id: id,
        type: 'group',
        members: [user, {firstname: 'Eric', lastname: 'Cartman'}]
      };
      callback(data);
      var thenCallback = sinon.spy();
      channelsService.getChannel(id).then(thenCallback);
      $rootScope.$digest();
      expect(thenCallback).to.have.been.calledWith(data);
      callback(data);
      expect(thenCallback).to.have.been.calledWith({
        _id:id,
        type: 'group',
        members: [user, {firstname: 'Eric', lastname: 'Cartman'}],
        name: 'Eric Cartman'
      });
    });
  });

});
