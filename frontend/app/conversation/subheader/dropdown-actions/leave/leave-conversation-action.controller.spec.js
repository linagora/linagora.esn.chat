'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ChatLeaveConversationDropdownActionController controller', function() {

  var $stateParams, $controller, $q, chatConversationsStoreServiceMock, $stateMock, chatConversationNameServiceMock, sessionMock, chatConversationActionsServiceMock, activeRoom;

  beforeEach(function() {

    activeRoom = {
      _id: 'roomId',
      creator: 'aCreator'
    };

    chatConversationsStoreServiceMock = {
      activeRoom: activeRoom,
      channels: [{_id: 'firstChannel'}, {_id: 'secondChannel'}]
    };

    chatConversationNameServiceMock = {
      getName: sinon.spy(function() {
        return $q.when();
      })
    };

    chatConversationActionsServiceMock = {
      leaveConversation: sinon.spy()
    };

    $stateMock = {
      go: sinon.spy()
    };

    sessionMock = {
      _id: 'id',
      user: {
        _id: 'userId'
      }
    };

    $stateParams = {
      id: 'id'
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('$stateParams', $stateParams);
      $provide.value('chatConversationNameService', chatConversationNameServiceMock);
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('chatConversationActionsService', chatConversationActionsServiceMock);
      $provide.value('$state', $stateMock);
      $provide.value('session', sessionMock);
    });

    angular.mock.inject(function(_$controller_, _$stateParams_, _$q_) {
      $controller = _$controller_;
      $stateParams = _$stateParams_;
      $q = _$q_;
    });
  });

  function initController() {
    var controller = $controller('ChatLeaveConversationDropdownActionController');

    return controller;
  }

  describe('the leaveConversation function', function() {

    it('should leave the conversation and redirecte user to the first possible conversation', function() {

      var controller = initController();

      controller.leaveConversation();

      expect(chatConversationActionsServiceMock.leaveConversation).to.be.calledWith(activeRoom);
      expect($stateMock.go).to.be.calledWith('chat.channels-views', {id: 'firstChannel'});
    });
  });
});
