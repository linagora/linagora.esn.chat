'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageService service', function() {
  var $rootScope, defaultType, message, chatBotMessageService;

  beforeEach(function() {
    defaultType = 'text';
    message = {
      attr: 'value'
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
    });

    angular.mock.inject(function(_$rootScope_, _chatBotMessageService_) {
      $rootScope = _$rootScope_;
      chatBotMessageService = _chatBotMessageService_;
    });
  });

  describe('the register function', function() {

    it('should fallback on default defaultType if not defined', function() {
      var defaultHandler = sinon.spy();

      chatBotMessageService.register(defaultType, defaultHandler);
      chatBotMessageService.resolve(null, message);
      expect(defaultHandler).to.have.been.calledWith(message);
    });

    it('should call the corresponding handler', function() {
      var type = 'type2';
      var handlerForType2 = sinon.spy();

      chatBotMessageService.register(type, handlerForType2);
      chatBotMessageService.resolve(type, message);
      expect(handlerForType2).to.have.been.calledWith(message);
    });

    it('should reject an error when call unregister handler', function(done) {
        var handler = sinon.spy();
        var type = 'type2';

      chatBotMessageService.register(defaultType, handler);
      chatBotMessageService
        .resolve(type, message)
        .then(function() {
          done('should not resolve');
        })
        .catch(function(err) {
          expect(err).to.shallowDeepEqual(new Error('Bot ' + type + ' subtype is not defined'));

          done();
        });

      $rootScope.$digest();
    });
  });
});
