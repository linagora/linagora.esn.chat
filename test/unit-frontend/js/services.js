'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat services', function() {
  var $q,
    ChatConversationService,
    CHAT_NAMESPACE,
    CHAT_EVENTS,
    sessionMock,
    user,
    listenChatWebsocket,
    livenotificationMock,
    $rootScope,
    userState,
    chatNamespace,
    $httpBackend;

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
          throw new Error(name + 'namespace has not been mocked');
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

  beforeEach(angular.mock.inject(function(_$q_, _listenChatWebsocket_, _ChatConversationService_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _userState_, _$httpBackend_) {
    $q = _$q_;
    listenChatWebsocket = _listenChatWebsocket_;
    ChatConversationService = _ChatConversationService_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    userState = _userState_;
    $httpBackend =  _$httpBackend_;
  }));

  describe('listenChatWebsocket', function() {
    describe('initListener', function() {
      beforeEach(function() {
        listenChatWebsocket.initListener();
        $rootScope.$broadcast = sinon.spy();
      });

      it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
          var data = {};
          callback(data);
          expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, data);
          return true;
        }));
      });

      it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CHANNEL and broadcast regular channel as it on $rootScope', function() {
        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, sinon.match.func.and(function(callback) {
          var data = {};
          callback(data);
          expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, data);
          return true;
        }));
      });

      it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CHANNEL and broadcast channel which are group after having computing her name as it on $rootScope', function() {
        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, sinon.match.func.and(function(callback) {
          var data = {
            type: 'group',
            members: [user, {firstname: 'Eric', lastname: 'Cartman'}]
          };
          callback(data);
          expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, {
            type: 'group',
            members: [user, {firstname: 'Eric', lastname: 'Cartman'}],
            name: 'Eric Cartman'
          });
          return true;
        }));
      });

      it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.NEW_CHANNEL but not broatcast group if they do not concern the user', function() {
        expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.NEW_CHANNEL, sinon.match.func.and(function(callback) {
          var data = {
            type: 'group',
            members: [{firstname: 'Eric', lastname: 'Cartman'}]
          };
          callback(data);
          expect($rootScope.$broadcast).to.have.not.been.called;
          return true;
        }));
      });
    });
  });

  describe('userState service', function() {
    it('should get /chat/api/status/userId to get the data the first time and cache it for the second time', function() {
      var state = 'state';
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/state/userId').respond({state: state});
      userState.get('userId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(state);
      callback.reset();

      userState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });

    it('should save broadcasted change', function() {
      var state = 'of alabama';
      $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, {
        userId: 'userId',
        state: state
      });

      var callback = sinon.spy();
      userState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });
  });

  describe('ChatConversationService service', function() {
    describe('computeGroupName', function() {
      it('should use firstname and lastname', function() {
        expect(ChatConversationService.computeGroupName('userId', {
          members: [{_id: 'youId', firstname: 'you', lastname: 'YOU'}]
        })).to.equal('you YOU');
      });

      it('should remove remove user which has the given id', function() {
        expect(ChatConversationService.computeGroupName('userId', {
          members: [{_id: 'userId', firstname: 'me', lastname: 'ME'}, {_id: 'youId', firstname: 'you', lastname: 'YOU'}]
        })).to.equal('you YOU');
      });

      it('should display all user if more than one', function() {
        expect(ChatConversationService.computeGroupName('userId', {
          members: [{_id: '1', firstname: 'Eric', lastname: 'Cartman'}, {_id: '2', firstname: 'Stan', lastname: 'Marsh'}, {_id:3, firstname: 'Kenny', lastname: 'McCormick'}]
        })).to.equal('Eric Cartman, Stan Marsh, Kenny McCormick');
      });
    });

    describe('getChannel', function() {
      it('should fetch data from the rest API', function() {
        var channel = {_id:'channelId'};
        var callback = sinon.spy();
        $httpBackend.expectGET('/chat/api/chat/channels/channelId').respond(channel);
        ChatConversationService.getChannel('channelId').then(callback);
        $rootScope.$digest();
        $httpBackend.flush();
        expect(callback).to.have.been.calledWith(sinon.match(channel));
      });
    });

    describe('getChannels', function() {
      it('should fetch data from the rest API', function() {
        var channels = [1, 2, 3];
        var callback = sinon.spy();
        $httpBackend.expectGET('/chat/api/chat/channels').respond(channels);
        ChatConversationService.getChannels().then(callback);
        $rootScope.$digest();
        $httpBackend.flush();
        expect(callback).to.have.been.calledWith(sinon.match({
          0: 1,
          1: 2,
          2: 3,
          length: 3
        }));
      });
    });

    describe('getGroups', function() {
      it('should fetch data from the rest API', function() {
        sessionMock.ready = $q.when({user:user});
        var groups = [1, 2].map(function(i) {
          return {_id: i, members: [{_id: i, firstname: String(i), lastname: String(i)}]};
        });
        var callback = sinon.spy();
        $httpBackend.expectGET('/chat/api/chat/me/groups').respond(groups);
        ChatConversationService.getGroups().then(callback);
        $rootScope.$digest();
        $httpBackend.flush();
        expect(callback).to.have.been.calledWith(sinon.match({
          0: {_id: 1, name: '1 1'},
          length: 2
        }));
      });
    });
  });
});
