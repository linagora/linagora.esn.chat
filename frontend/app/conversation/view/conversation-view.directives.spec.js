'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.chat conversation-view directive', function() {
  var $compile, $rootScope, moment;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.emoticon');
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$compile_, _moment_) {
    $rootScope = _$rootScope_;
    moment = _moment_;
    $compile = _$compile_;
  }));

  describe('The messageSeparation directive', function() {
    var $scope,
        currentMessage,
        prevMessage,
        element;

    function initDirective() {
      $scope = $rootScope.$new();
      $scope.currentMessage = currentMessage;
      $scope.prevMessage = prevMessage;

      element = $compile('<div><chat-message-separator prev-message="prevMessage", current-message="currentMessage"/></div>')($scope);
      $scope.$digest();
    }

    it('should create a message separation with value Today', function() {
      currentMessage = {
        timestamps: {
          creation: moment().format('x')
        }
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal('Today');
    });

    it('should create a message separation with value a date', function() {
      currentMessage = {
        timestamps: {
          creation: moment().subtract(2, 'days').format('x')
        }
      };
      prevMessage = {
        timestamps: {
          creation: moment().subtract(5, 'days').format('x')
        }
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal(moment(currentMessage.timestamps.creation, 'x').format('Do MMMM'));
    });

    it('should create a message separation with value Yesterday', function() {
      currentMessage = {
        timestamps: {
          creation: moment().subtract(1, 'days').format('x')
        }
      };
      prevMessage = {
        timestamps: {
          creation: moment().subtract(2, 'days').format('x')
        }
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(1);
      expect(angular.element(element.find('.day-divider-label span')).text()).to.be.equal('Yesterday');
    });

    it('should not create a message separation for the two messages with the same date and not first', function() {
      currentMessage = {
        timestamps: {
          creation: moment().format('x')
        }
      };
      prevMessage = {
        timestamps: {
          creation: moment().format('x')
        }
      };
      initDirective();
      expect(angular.element(element.find('.day-divider')).length).to.be.equal(0);
    });
  });

});
