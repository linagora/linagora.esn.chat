'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ChatShowInformationDropdownActionController controller', function() {

  var $controller, $scope, $rootScope, $state;
  var chatConversationsStoreServiceMock;

  beforeEach(function() {

    chatConversationsStoreServiceMock = {
      activeRoom: { _id: '222' }
    };

    $state = {
      go: sinon.spy(),
      includes: sinon.stub()
    };

    module('linagora.esn.chat');

    module(function($provide) {
      $provide.value('chatConversationsStoreService', chatConversationsStoreServiceMock);
      $provide.value('$state', $state);
    });

    inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;

      $scope = $rootScope.$new();
    });
  });

  function initController() {
    return $controller('ChatShowInformationDropdownActionController', { $scope: $scope });
  }

  describe('on $stateChangeSuccess event', function() {

    it('should set informationShown to true when current state is changed to channel summary', function() {
      var controller = initController();

      $scope.$emit('$stateChangeSuccess', {
        name: 'chat.channels-views.summary'
      });

      expect(controller.informationShown).to.be.true;
    });

    it('should set informationShown to false when new state is not channel summary', function() {
      var controller = initController();

      $scope.$emit('$stateChangeSuccess', {
        name: 'chat.channels-views'
      });

      expect(controller.informationShown).to.be.false;
    });
  });

  describe('The toggleDisplay function', function() {
    it('should go to the view of current active conversation if summary is currently displayed', function() {
      var controller = initController();

      $state.includes.returns(true);

      controller.toggleDisplay();

      expect($state.go).to.have.been.calledWith('chat.channels-views');
      expect($state.includes).to.have.been.calledWith('chat.channels-views.summary');
    });

    it('should go to the view of conversation summary if summary is currently not displayed', function() {
      var controller = initController();

      $state.includes.returns(false);

      controller.toggleDisplay();

      expect($state.go).to.have.been.calledWith('chat.channels-views.summary', {
        id: chatConversationsStoreServiceMock.activeRoom._id
      });
      expect($state.includes).to.have.been.calledWith('chat.channels-views.summary');
    });
  });
});
