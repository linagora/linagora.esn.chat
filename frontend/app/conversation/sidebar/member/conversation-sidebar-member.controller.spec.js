'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationSidebarMemberController', function() {

  var $controller, $q, $rootScope;
  var sessionMock, stateParamsMock, stateMock, userAPIMock, notificationFactoryMock;

  beforeEach(function() {
    userAPIMock = {
      user: sinon.spy(function() {
        return $q.when([]);
      })
    };

    notificationFactoryMock = {
      weakError: sinon.spy()
    };

    stateParamsMock = {
      id: 'id',
      memberId: 'memberId'
    };

    stateMock = {
      go: sinon.spy()
    };

    sessionMock = {
      user: {
        _id: 'userid'
      }
    };

    module('linagora.esn.chat', function($provide) {
      $provide.value('newProvider', function(_provider) {
        return _provider;
      });
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationService', {});
      $provide.value('$stateParams', stateParamsMock);
      $provide.value('$state', stateMock);
      $provide.value('userAPI', userAPIMock);
      $provide.value('session', sessionMock);
      $provide.value('notificationFactory', notificationFactoryMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$controller_, _$q_, _$rootScope_) {
    $controller = _$controller_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  function initController() {
    return $controller('ChatConversationSidebarMemberController');
  }

  describe('the $onInit', function() {
    it('should set self.user to current session user if the member to show info is the current user', function() {
      stateParamsMock.memberId = sessionMock.user._id;

      var controller = initController();

      controller.$onInit();

      expect(controller.user).to.deep.equal(sessionMock.user);
      expect(controller.me).to.be.true;
      expect(userAPIMock.user).to.not.have.been.called;
    });

    it('should call userAPI.user with $stateParams.memberId', function() {
      var controller = initController();

      controller.$onInit();

      expect(userAPIMock.user).to.have.been.calledWith(stateParamsMock.memberId);
    });

    it('should set self.user to response.data when userAPI.user is called', function(done) {
      var controller = initController();
      var response = {data: 'data'};

      userAPIMock.user = sinon.stub().returns($q.when(response));

      controller.$onInit();
      $rootScope.$digest();
      userAPIMock.user(stateParamsMock.memberId)
      .then(function(response) {
        expect(controller.user).to.be.equal(response.data);
        done();
      });

      $rootScope.$digest();
    });

    it('should call notificationFactoryMock.weakError and change state to chat.channels-views on reject', function(done) {
      var controller = initController();

      userAPIMock.user = sinon.stub().returns($q.reject());

      controller.$onInit();
      $rootScope.$digest();
      userAPIMock.user(stateParamsMock.memberId)
      .catch(function() {
        expect(notificationFactoryMock.weakError).to.have.been.calledWith('error', 'user not found');
        expect(stateMock.go).to.have.been.calledWith('chat.channels-views');
        done();
      });

      $rootScope.$digest();
    });
  });
});
