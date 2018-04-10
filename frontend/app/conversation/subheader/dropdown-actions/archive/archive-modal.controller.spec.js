'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ChatLeaveConversationDropdownActionController controller', function() {

  var $controller, $q, chatConversationsStoreServiceMock, $stateMock, sessionMock, chatConversationActionsServiceMock, activeRoom, $rootScope;

  beforeEach(function() {

    activeRoom = {
      _id: 'roomId',
      creator: 'aCreator'
    };

    chatConversationsStoreServiceMock = {
      activeRoom: activeRoom,
      channels: [{_id: 'firstChannel'}, {_id: 'secondChannel'}]
    };

    chatConversationActionsServiceMock = {
      archiveConversation: sinon.spy(function() {
        return $q.when();
      })
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

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('chatConversationActionsService', chatConversationActionsServiceMock);
      $provide.value('$state', $stateMock);
      $provide.value('session', sessionMock);
    });

    angular.mock.inject(function(_$controller_, _$q_, _$rootScope_) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
    });
  });

  function initController() {
    var controller = $controller('ChatArchiveModalController');

    return controller;
  }

  describe('the archive function', function() {

    it('should archive the conversation and redirecte user to the first possible conversation', function() {

      var controller = initController();

      controller.archive();
      $rootScope.$digest();

      expect(chatConversationActionsServiceMock.archiveConversation).to.be.calledWith(activeRoom._id);
      expect($stateMock.go).to.be.calledWith('chat.channels-views', {id: 'firstChannel'});
    });
  });
});
