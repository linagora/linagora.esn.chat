'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationItemController controller', function() {
  var userStatusService,
  $q,
  $rootScope,
  $scope,
  $controller,
  userStateResult,
  session,
  user,
  CHAT_EVENTS,
  userUtils,
  getConversationNameMock,
  getConversationNameServiceMock,
  conversationNameResult,
  searchProviders,
  channels,
  chatLastConversationServiceMock;

  beforeEach(function() {
    userStatusService = {
      getCurrentStatus: sinon.spy(function(id) {
        return $q.when(userStateResult[id]);
      })
    };

    userUtils = {
      displayNameOf: sinon.spy(function(user) {
        return user.firstname + ' ' + user.lastname;
      })
    };

    conversationNameResult = 'name';

    getConversationNameMock = sinon.spy(function() {
      return conversationNameResult;
    });

    getConversationNameServiceMock = {
      getName: sinon.spy(function() {
        return $q.when();
      })
    };

    session = {
      user: {
        _id: 'userId'
      }
    };

    searchProviders = {
      add: sinon.spy()
    };

    chatLastConversationServiceMock = {
      getConversationId: sinon.spy(function() {
        return $q.when(channels);
      }),
      saveConversationId: sinon.spy(function() {
        return $q.when([]);
      })
    };

    channels = {channelId: '583e9769ecac5c59a19fe6af'};

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', searchProviders);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('userStatusService', userStatusService);
      $provide.value('session', session);
      $provide.value('userUtils', userUtils);
      $provide.value('chatConversationNameService', getConversationNameServiceMock);
      $provide.value('chatParseMention', {
        parseMentions: sinon.spy()
      });
      $provide.value('chatLastConversationService', chatLastConversationServiceMock);
      $provide.value('esnEmoticonifyFilter', sinon.spy());
      $provide.factory('chatConversationsService', function($q) {
        return {getConversationNamePromise: $q.when(getConversationNameMock)};
      });
    });

    user = {
      _id: 'userId'
    };
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _CHAT_EVENTS_) {
    userStateResult = {};
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  describe('The $onInit function', function() {
    var conversation;

    function initController() {
      var controller = $controller('ChatConversationItemController',
        {$scope: $scope},
        {conversation: conversation}
      );

      $scope.$digest();

      return controller;
    }

    beforeEach(function() {
      userStateResult = {2: {status: 'connected'}, 3: {status: 'connected'}};
      conversation = {
        _id: 1,
        members: [{member: {id: user._id, objectType: 'user'}}, {member: {id: 2, objectType: 'user'}}, {member: {id: 3, objectType: 'user'}}],
        last_message: {
          creator: user
        }
      };
    });

    it('should initialize ctrl.connected to true only if all users other than current one are not disconnected', function() {
      userStateResult = {2: {status: 'connected'}, 3: {status: 'connected'}};
      userStateResult[session.user._id] = {status: 'disconnected'};
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(2);
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(3);
      expect(controller.connected).to.be.true;
    });

    it('should initialize ctrl.connected to false only if only one user other than current one is disconnected', function() {
      userStateResult = {2: {status: 'connected'}, 3: {status: 'disconnected'}};
      userStateResult[session.user._id] = {status: 'disconnected'};
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(2);
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(3);
      expect(controller.connected).to.be.false;
    });

    it('should set lastMessageIsMe to true if the last message is from current user', function() {
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      expect(controller.lastMessageIsMe).to.be.equal(true);
    });

    it('should set lastMessageIsMe to false if the last message is not from current user', function() {
      conversation.last_message.creator._id = 'userId2';
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      expect(controller.lastMessageIsMe).to.be.equal(false);
    });

    describe('listen to CHAT_EVENTS.TEXT_MESSAGE', function() {
      var callback, destroy, controller, message;

      beforeEach(function() {
        message = {
          creator: {
            _id: user._id
          },
          message: {
            channel: conversation._id
          }
        };
        destroy = sinon.spy();
        $scope.$on = sinon.stub().returns(destroy);
        controller = initController();

        controller.$onInit();
        expect($scope.$on).to.have.been.calledWith(CHAT_EVENTS.TEXT_MESSAGE, sinon.match.func.and(function(_callback) {
          callback = _callback;

          return true;
        }));
        $rootScope.$digest();
      });

      it('should do nothing when message is for a conversation which is not the current one', function() {
        var lastValue = 'dont touch me';

        message.channel = 'anotherchannel';
        controller.lastMessageIsMe = lastValue;
        callback(null, message);
        expect(controller.lastMessageIsMe).to.be.equal(lastValue);
      });

      it('should set lastMessageIsMe to true if the new message is from current user', function() {
        message.creator._id = 'userId';
        callback(null, message);
        expect(controller.lastMessageIsMe).to.be.equal(true);
      });

      it('should set lastMessageIsMe to false if the new message is not from current user', function() {
        controller.lastMessageIsMe = false;
        message.creator._id = 'userId2';

        callback(null, message);
        expect(controller.lastMessageIsMe).to.be.equal(false);
      });
    });

    describe('listen to CHAT_EVENTS.USER_CHANGE_STATE', function() {
      var callback, controller;

      beforeEach(function() {
        $scope.$on = sinon.stub();
        controller = initController();
        controller.$onInit();
        expect($scope.$on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(_callback) {
          callback = _callback;

          return true;
        }));
        $rootScope.$digest();
      });

      it('should set ctrl.connected to false if a user from the channel has disconnected', function() {
        callback(null, {
          userId: 2,
          state: 'disconnected'
        });

        expect(controller.connected).to.be.false;
      });

      it('should ignore state change of current user', function() {
        callback(null, {
          userId: 'userId',
          state: 'disconnected'
        });

        expect(controller.connected).to.be.true;
      });

      it('should ignore state change of user who is not in the group', function() {
        callback(null, {
          userId: 4,
          state: 'disconnected'
        });

        expect(controller.connected).to.be.true;
      });

      it('should set state back to connected if user was the last one disconnected before he get connected', function() {
        callback(null, {
          userId: 2,
          state: 'disconnected'
        });

        callback(null, {
          userId: 1,
          state: 'disconnected'
        });

        callback(null, {
          userId: 1,
          state: 'connected'
        });

        expect(controller.connected).to.be.false;

        callback(null, {
          userId: 2,
          state: 'connected'
        });

        expect(controller.connected).to.be.true;
      });
    });

    describe('the onConversationItemClicked function', function() {
      var controller, conversationId;

      beforeEach(function() {
        conversationId = 'aConversationId';
        controller = initController();
      });

      it('should call chatLastConversationService.saveConversation when conversationId is defined', function() {

        controller.onConversationItemClicked(conversationId);

        expect(chatLastConversationServiceMock.saveConversationId).to.have.been.calledWith(session.user._id, conversationId);
      });

      it('should not call chatLastConversationService.saveConversation if conversationId is undefined', function() {

        controller.onConversationItemClicked();

        expect(chatLastConversationServiceMock.saveConversationId).to.not.have.been.called;
      });
    });

  });
});
