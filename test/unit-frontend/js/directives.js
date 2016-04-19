'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The linagora.esn.chat module directive', function() {
  var userState, $q, $rootScope, userStateResult, $compile, session, user, CHAT_EVENTS;

  beforeEach(function() {
    userState = {
      get: sinon.spy(function(id) {
        return $q.when(userStateResult(id));
      })
    };

    session = {};
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.chat.core', function($provide) {
      $provide.value('userState', userState);
      $provide.value('_', _);
      $provide.value('session', session);
    });

    user = {
      _id: 'userId'
    };
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$compile_, _CHAT_EVENTS_) {
    userStateResult = _.constant(true);
    $q = _$q_;
    session.ready = $q.when({user:user});
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    CHAT_EVENTS = _CHAT_EVENTS_;
  }));

  describe('The chatChannelItem directive', function() {
    var item, $scope, eleScope;

    function initDirective() {
      $scope = $rootScope.$new();
      $scope.item = item;
      var element = $compile('<chat-channel-item item="item"/>')($scope);
      $scope.$digest();
      eleScope = element.isolateScope();
    }

    beforeEach(function() {
      item = {
        members: [user, {_id:2}, {_id: 3}]
      };
    });

    it('should initialize allUsersConnected to true only if all user other than me are not disconnected', function() {
      userStateResult = function(id) {
        ({userId: false, 2: 'connected', 3: 'connected'})[id];
      };
      initDirective();
      $rootScope.$digest();
      expect(userState.get).to.have.been.calledWith(2);
      expect(userState.get).to.have.been.calledWith(3);
      expect(eleScope.allUsersConnected).to.be.true;
    });

    it('should initialize allUsersConnected to false only if only one user other than me is disconnected', function() {
      userStateResult = function(id) {
        return ({userId: false, 2: 'connected', 3: 'disconnected'})[id];
      };
      initDirective();
      $rootScope.$digest();
      expect(userState.get).to.have.been.calledWith(2);
      expect(userState.get).to.have.been.calledWith(3);
      expect(eleScope.allUsersConnected).to.be.false;
    });

    describe('listen to CHAT_EVENTS.USER_CHANGE_STATE', function() {
      var callback, destroy;
      beforeEach(function() {
        destroy = sinon.spy();
        $rootScope.$on = sinon.stub().returns(destroy);
        initDirective();
        expect($rootScope.$on).to.have.been.calledWith(CHAT_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(_callback) {
          callback = _callback;
          return true;
        }));
      });

      it('should set allUsersConnected to false if a user from the channel has disconnected', function() {
        callback(null, {
          userId: 2,
          state: 'disconnected'
        });

        expect(eleScope.allUsersConnected).to.be.false;
      });

      it('should ignore state changement of current user', function() {
        callback(null, {
          userId: 'userId',
          state: 'disconnected'
        });

        expect(eleScope.allUsersConnected).to.be.true;
      });

      it('should ignore state changement of user which are not in the group', function() {
        callback(null, {
          userId:4,
          state: 'disconnected'
        });

        expect(eleScope.allUsersConnected).to.be.true;
      });

      it('should set state back to connected if user was the last one disconnected before he get connected', function() {
        callback(null, {
          userId:2,
          state: 'disconnected'
        });

        callback(null, {
          userId:1,
          state: 'disconnected'
        });

        callback(null, {
          userId:1,
          state: 'connected'
        });

        expect(eleScope.allUsersConnected).to.be.false;

        callback(null, {
          userId:2,
          state: 'connected'
        });

        expect(eleScope.allUsersConnected).to.be.true;
      });

      it('should unregister hanlder when scope get destroyed', function() {
        eleScope.$broadcast('$destroy');
        expect(destroy).to.have.been.called;
      });
    });
  });
});
