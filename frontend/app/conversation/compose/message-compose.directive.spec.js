'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The message-compose directive', function() {
  var $scope, $rootScope, $compile, $q, chatComposerState, deviceDetector, chatConversationsStoreService, chatMessageService, domainAPI;

  beforeEach(function() {
    chatComposerState = {
      getMessage: sinon.spy(
        function() {
          return $q.when([]);
      }),
      saveMessage: sinon.spy()
    };

    deviceDetector = {
      isMobile: sinon.spy()
    };

    chatConversationsStoreService = {
      activeRoom: {_id: '1'}
    };

    chatMessageService = {
      sendUserTyping: sinon.spy(),
      sendMessage: sinon.spy(),
      sendMessageWithAttachments: sinon.spy(),
      connect: sinon.spy()
    };

    domainAPI = {
      getMembers: sinon.spy(function() {
        return $q.when();
      })
    };

    module('jadeTemplates');
    module('linagora.esn.chat', function($provide) {
      $provide.value('chatComposerState', chatComposerState);
      $provide.value('deviceDetector', deviceDetector);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatMessageService', chatMessageService);
      $provide.value('domainAPI', domainAPI);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', {user: {_id: ''}});
      $provide.value('chatUsername', {generate: function() {}});
      $provide.value('chatScrollService', {scrollDown: sinon.spy()});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('esnEmoticonRegistry', {getShortNames: sinon.spy()});
      $provide.value('notificationFactory', {});
    });
  });

  beforeEach(inject(function(_$rootScope_, _$compile_, _$q_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
  }));

  function initDirective() {
    $scope = $rootScope.$new();
    $compile('<chat-message-compose channel-id=""></chat-message-compose>')($scope);
    $scope.$digest();
  }

  it('should call getMessage', function() {
    var getMessageResult = 'test';

    chatComposerState.getMessage = sinon.stub().returns($q.when({
      text: getMessageResult
    }));

    initDirective();
    expect(chatComposerState.getMessage).to.be.called;
    expect($scope.text).to.equal(getMessageResult);
  });

  it('should call saveMessage on scope destroy', function() {
    initDirective();
    $scope.text = 'test';
    var roomId = chatConversationsStoreService.activeRoom._id;

    $scope.$destroy();
    expect(chatComposerState.saveMessage).to.have.been.calledWith(roomId, {text: $scope.text});
  });
});
