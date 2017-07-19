'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatUserTypingController controller', function() {

  var $q, $rootScope, $scope, $controller;
  var event, channelId, message, session, user, chatConversationsStoreService, chatUsername, isMemberOfConversation, chatConversationMemberService, CHAT_MESSAGE_TYPE;

  beforeEach(function() {
    isMemberOfConversation = true;
    user = {_id: 1};
    channelId = 3;
    session = {user: user};
    message = {_id: 2, state: true, channel: channelId, creator: {_id: session.user._id}};

    chatConversationsStoreService = {
      activeRoom: {
        _id: channelId
      }
    };

    chatUsername = {
      getFromCache: sinon.spy(function() {
        return $q.when();
      })
    };

    chatConversationMemberService = {
      currentUserIsMemberOf: sinon.spy(function() {
        return isMemberOfConversation;
      })
    };

    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatConversationMemberService', chatConversationMemberService);
      $provide.value('chatUsername', chatUsername);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _CHAT_MESSAGE_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT_MESSAGE_TYPE = _CHAT_MESSAGE_TYPE_;
    event = 'chat:message:' + CHAT_MESSAGE_TYPE.USER_TYPING;
  }));

  function getController() {
    var controller = $controller('ChatUserTypingController', {$scope: $scope});

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should register a $scope listener on "chat:message:user_typing" events', function() {
      var scopeOnSpy = sinon.spy($scope, '$on');

      getController().$onInit();

      expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func);
    });

    describe('on "chat:message:user_typing" event', function() {
      it('should do nothing when message is undefined', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        message = undefined;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.be.empty;
          expect(controller.usersTyping).to.not.be.defined;

          return true;
        })));
      });

      it('should do nothing when message creator is undefined', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        message.creator = undefined;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.be.empty;
          expect(controller.usersTyping).to.not.be.defined;

          return true;
        })));
      });

      it('should do nothing when message creator id is undefined', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        message.creator = {};
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.be.empty;
          expect(controller.usersTyping).to.not.be.defined;

          return true;
        })));
      });

      it('should do nothing when current user is not member of the conversation', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        isMemberOfConversation = false;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.be.empty;
          expect(controller.usersTyping).to.not.be.defined;

          return true;
        })));
      });

      it('should not include current user when he is the message creator', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.deep.equals({1: message});
          expect(controller.usersTyping).to.be.empty;

          return true;
        })));
      });

      it('should not include user when message.state is falsy', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        message.state = false;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.deep.equals({1: message});
          expect(controller.usersTyping).to.be.empty;

          return true;
        })));
      });

      it('should not include user when not part of current channel', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        chatConversationsStoreService.activeRoom._id = '!' + message.channel;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(controller.typing).to.deep.equals({1: message});
          expect(controller.usersTyping).to.be.empty;

          return true;
        })));
      });

      it('should include user when not current user, message.state is true and related to current conversation', function() {
        var scopeOnSpy = sinon.spy($scope, '$on');
        var controller = getController();

        message.creator._id = '!' + session.user._id;
        controller.$onInit();

        expect(scopeOnSpy).to.have.been.calledWith(event, sinon.match.func.and(sinon.match(function(onUserTyping) {
          onUserTyping(event, message);

          expect(chatUsername.getFromCache).to.have.been.calledWith(message.creator._id, false);
          expect(controller.typing).to.deep.equals({'!1': message});

          return true;
        })));
      });
    });
  });
});
