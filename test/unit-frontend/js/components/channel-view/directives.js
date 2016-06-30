'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.chat channel-view directive', function() {
  var $compile,
      $rootScope,
      $timeout,
      session,
      moment;

  beforeEach(function() {
    session = {};
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.emoticon');
    angular.mock.module('linagora.esn.chat');
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$compile_, _moment_, _$timeout_) {
    $rootScope = _$rootScope_;
    moment = _moment_;
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  describe('The messageSeparation directive', function() {
    var $scope,
        currentMessage,
        prevMessage,
        first,
        element;

    function initDirective() {
      $scope = $rootScope.$new();
      $scope.currentMessage = currentMessage;
      $scope.prevMessage = prevMessage;
      $scope.$first = first;

      element = $compile('<div><chat-message-separator prev-message="prevMessage", current-message="currentMessage"/></div>')($scope);
      $scope.$digest();
    }

    it('should create a message separation with value Today for the first message', function() {
      currentMessage = {
        date: moment()
      };
      prevMessage = null;
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal('Today');
    });

    it('should create a message separation with value a date for a message', function() {
      currentMessage = {
        date: moment().subtract(2, 'days')
      };
      prevMessage = {
        date: moment()
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal(currentMessage.date.format('MMMM Do'));
    });

    it('should create a message separation with value Yesterday for a message', function() {
      currentMessage = {
        date: moment().subtract(1, 'days')
      };
      prevMessage = {
        date: moment()
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal('Yesterday');
    });

    it('should not create a message separation for the two messages with the same date and not first', function() {
      currentMessage = {
        date: moment()
      };
      prevMessage = {
        date: moment()
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(0);
    });
  });

});
