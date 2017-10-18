'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ChatConversationItemIconController controller', function() {
  var $rootScope, $scope, $controller;
  var CHAT_CONVERSATION_TYPE, CHAT_STATUS_ICON;

  beforeEach(function() {
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$controller_, _CHAT_CONVERSATION_TYPE_, _CHAT_STATUS_ICON_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT_CONVERSATION_TYPE = _CHAT_CONVERSATION_TYPE_;
    CHAT_STATUS_ICON = _CHAT_STATUS_ICON_;
  }));

  function getNewController(conversation) {
    var controller = $controller('ChatConversationItemIconController',
      {$scope: $scope},
      {conversation: conversation}
    );

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    var conversation;

    beforeEach(function() {
      conversation = {
        _id: 1,
        members_count: 0,
        type: CHAT_CONVERSATION_TYPE.OPEN
      };
    });

    it('should ctrl.iconType to CHAT_STATUS_ICON.OPEN if conversation type is not CHAT_CONVERSATION_TYPE.CONFIDENTIAL', function() {
      conversation.type = '!' + CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;

      var controller = getNewController(conversation);

      controller.$onInit();

      expect(controller.iconType).to.equal(CHAT_STATUS_ICON.OPEN);
    });

    it('should ctrl.iconType to CHAT_STATUS_ICON.DM if conversation type is CHAT_CONVERSATION_TYPE.CONFIDENTIAL and members_count is 2', function() {
      conversation.type = CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;
      conversation.members_count = 2;

      var controller = getNewController(conversation);

      controller.$onInit();

      expect(controller.iconType).to.equal(CHAT_STATUS_ICON.DM);
    });

    it('should ctrl.iconType to CHAT_STATUS_ICON.CONFIDENTIAL if conversation type is CHAT_CONVERSATION_TYPE.CONFIDENTIAL and members_count is !== 2', function() {
      conversation.type = CHAT_CONVERSATION_TYPE.DIRECT_MESSAGE;
      conversation.members_count = 3;

      var controller = getNewController(conversation);

      controller.$onInit();

      expect(controller.iconType).to.equal(CHAT_STATUS_ICON.CONFIDENTIAL);
    });
  });
});
