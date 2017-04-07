'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The Chat Conversation Beginning Controller ', function() {
  var $q,
      $rootScope,
      $scope,
      $controller,
      controller,
      user,
      conversation,
      chatConversationNameServiceMock,
      chatConversationNameService,
      chatUsernameMock,
      CHAT_CONVERSATION_TYPE;

  beforeEach(function() {
    conversation = {
      _id: 1,
      name: 'MyConversation',
      members: [{member: {
        id: 1,
        objectType: 'user'
      }}, {member: {
        id: 2,
        objectType: 'user'
      }}],
      creator: '1'
    };

    chatConversationNameServiceMock = {
      getName: sinon.spy(function() {
        return $q.when();
      })
    };

    user = {
      _id: 'userId',
      name: 'userName'
    };
    chatUsernameMock = {
      getFromCache: sinon.spy(function() {
        return $q.when(user.name);
      })
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('newProvider', function(_provider) {
        return _provider;
      });
      $provide.value('chatUsername', chatUsernameMock);
      $provide.value('chatConversationNameService', chatConversationNameServiceMock);
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', {user: user});
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _chatConversationNameService_, _chatUsername_, _CHAT_CONVERSATION_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    chatConversationNameService = _chatConversationNameService_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
  }));

  beforeEach(function() {
    function initController() {
      var controller = $controller('ChatConversationBeginningController', {
        $scope: $scope
      }, {conversation: conversation});

      $scope.$digest();

      return controller;
    }

    controller = initController();
  });

  describe('The $onInit function', function() {

    it('should call chatConversationNameService.getName with conversation.name', function() {
      controller.$onInit();

      expect(chatConversationNameService.getName).to.have.been.calledWith(controller.conversation);
    });

    it('should call chatUsername.getFromCache when conversation type is confidential', function() {
      controller.conversation.type = CHAT_CONVERSATION_TYPE.CONFIDENTIAL;
      controller.$onInit();

      expect(chatUsernameMock.getFromCache).to.have.been.calledWith(controller.conversation.members[0].member.id);
      expect(chatUsernameMock.getFromCache).to.have.been.calledWith(controller.conversation.members[1].member.id);
    });
  });
});
