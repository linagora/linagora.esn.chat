'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat services', function() {
  var $q,
    ChatConversationService,
    CHAT_NAMESPACE,
    CHAT_EVENTS,
    sessionMock,
    user,
    livenotificationMock,
    $rootScope,
    scope,
    chatUserState,
    chatNamespace,
    $httpBackend,
    chatNotification,
    chatLocalStateService,
    channelsServiceMock,
    groups,
    channels,
    localStorageService,
    getItem,
    setItem,
    getItemResult;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {

    user = {_id: 'userId'};

    chatNamespace = {on: sinon.spy()};

    sessionMock = {
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

    groups = [{_id: 'group1', type: 'group'}, {_id: 'group2', type: 'group'}];
    channels = [{_id: 'channel1', type: 'channel'}, {_id: 'channel2', type: 'channel'}];

    channelsServiceMock = {
      getChannels: function() {
        return $q.when(channels);
      },
      getGroups: function() {
        return $q.when(groups);
      }
    };

    getItemResult = 'true';
    getItem = sinon.spy(function(key) {
      return $q.when(({
        isNotificationEnabled: getItemResult
      })[key]);
    });
    setItem = sinon.spy(function() {
      return $q.when({});
    });
    localStorageService = {
      getOrCreateInstance: sinon.stub().returns({
        getItem: getItem,
        setItem:  setItem
      })
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

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
      $provide.value('channelsService', channelsServiceMock);
      $provide.value('localStorageService', localStorageService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _ChatConversationService_, _chatNotification_, _CHAT_NAMESPACE_, _CHAT_EVENTS_, _$rootScope_, _chatUserState_, _$httpBackend_, _chatLocalStateService_) {
    $q = _$q_;
    ChatConversationService = _ChatConversationService_;
    chatNotification = _chatNotification_;
    CHAT_NAMESPACE = _CHAT_NAMESPACE_;
    CHAT_EVENTS = _CHAT_EVENTS_;
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    chatUserState = _chatUserState_;
    $httpBackend =  _$httpBackend_;
    chatLocalStateService = _chatLocalStateService_;
  }));

  describe('chatUserState service', function() {

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var data = {};
        callback(data);
        expect($rootScope.$broadcast).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, data);
        return true;
      }));
    });

    it('should listen to CHAT_NAMESPACE:CHAT_EVENTS.USER_CHANGE_STATE and save change', function() {
      $rootScope.$broadcast = sinon.spy();
      expect(chatNamespace.on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var state = 'of alabama';
        callback({
          userId: 'userId',
          state: state
        });
        var promiseCallback = sinon.spy();
        chatUserState.get('userId').then(promiseCallback);
        $rootScope.$digest();
        expect(promiseCallback).to.have.been.calledWith(state);
        return true;
      }));
    });

    it('should get /chat/api/status/userId to get the data the first time and cache it for the second time', function() {
      var state = 'state';
      var callback = sinon.spy();
      $httpBackend.expectGET('/chat/api/chat/state/userId').respond({state: state});
      chatUserState.get('userId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(state);
      callback.reset();

      chatUserState.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });
  });

  describe('ChatConversationService service', function() {
  });

  describe('chatNotification service', function() {
    describe('start() method', function() {
      it('should listen to CHAT_EVENTS.TEXT_MESSAGE', function() {
        $rootScope.$on = sinon.spy();
        chatNotification.start();
        expect($rootScope.$on).to.have.been.calledWith(CHAT_EVENTS.TEXT_MESSAGE);
      });
    });
  });

  describe('chatLocalState service', function() {
    var chatLocalStateService, CHAT_CHANNEL_TYPE, CHAT_DEFAULT_CHANNEL;

    beforeEach(angular.mock.inject(function(_chatLocalStateService_, _CHAT_CHANNEL_TYPE_, _CHAT_DEFAULT_CHANNEL_) {
      chatLocalStateService = _chatLocalStateService_;
      CHAT_CHANNEL_TYPE = _CHAT_CHANNEL_TYPE_;
      CHAT_DEFAULT_CHANNEL = _CHAT_DEFAULT_CHANNEL_;
    }));

    beforeEach(function() {
      chatLocalStateService.initLocalState();
      $rootScope.$digest();
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

      it('should not fail if channel does not exist', function() {
        chatLocalStateService.unreadMessage({_id: 'channel42'});
      });
    });

    describe('add channel & group', function() {

      it('should add a channel', function() {
        var channel = {_id: 'channel3', type: 'channel'};
        chatLocalStateService.addChannel(channel);
        expect(channels).to.include(channel);
      });

      it('should add a group', function() {
        var group = {_id: 'group3', type: 'group'};
        chatLocalStateService.addGroup(group);
        expect(groups).to.include(group);
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
  });
});
