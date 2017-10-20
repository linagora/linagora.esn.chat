'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageController controller', function() {

  var $q, $rootScope, $scope, $controller, chatConversationActionsService, chatConversationService, privateConversation;
  var CHAT_CONVERSATION_TYPE;

  beforeEach(function() {

    privateConversation = { _id: 1, name: 'My conversation', type: 'directmessage', creator: { _id: 'userId1' }, members: [{member: {id: '1'}}, {member: {id: '2'}}]};
    chatConversationActionsService = {
      createDirectmessageConversation: sinon.spy(function() {
        return $q.when(privateConversation);
      })
    };
    chatConversationService = {
      get: sinon.spy(function() {
        return $q.when(privateConversation);
      })
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatConversationService', chatConversationService);
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _CHAT_CONVERSATION_TYPE_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    });
  });

  function initController(userMentions) {
    var controller = $controller('chatBotMessageNotMemberMentionController as ctrl',
      {$scope: $scope},
      {userMentions: userMentions}
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should call chatBotMessageService resolve\'s method', function() {
      var userMentions = [{_id: '3'}, {_id: '4'}];
      var controller = initController(userMentions);

      privateConversation.type = CHAT_CONVERSATION_TYPE.OPEN;
      chatConversationActionsService.addMember = sinon.spy();
      controller.$onInit();

      expect(controller.addMembers).to.be.an('function');

      controller.addMembers(userMentions);
      $rootScope.$digest();

      expect(chatConversationActionsService.addMember).to.have.been.calledTwice;
    });
  });

  describe('the addMembers function', function() {

    it('should call chatConversationActionsService.createDirectmessageConversation when CHAT_CONVERSATION_TYPE is not OPEN', function() {
      var userMentions = [{_id: '3'}, {_id: '4'}];

      var controller = initController(userMentions);

      controller.$onInit();
      controller.addMembers();
      $rootScope.$digest();

      expect(chatConversationActionsService.createDirectmessageConversation).to.have.been.calledWith({ members: ['1', '2', '3', '4'] });
    });

    it('should not call chatConversationActionsService.createDirectmessageConversation when CHAT_CONVERSATION_TYPE is OPEN', function() {
      var userMentions = [{_id: '3'}, {_id: '4'}];

      privateConversation.type = CHAT_CONVERSATION_TYPE.OPEN;
      var controller = initController(userMentions);

      chatConversationActionsService.addMember = sinon.spy();

      controller.$onInit();
      controller.addMembers();
      $rootScope.$digest();

      expect(chatConversationActionsService.createDirectmessageConversation).to.not.have.been.called;
      expect(chatConversationActionsService.addMember).to.have.been.called;
    });
  });
});
