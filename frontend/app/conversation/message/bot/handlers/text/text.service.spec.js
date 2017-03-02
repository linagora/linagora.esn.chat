'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageTextHandler service', function() {
  var oembedImageFilterMock, esnEmoticonifyMock, linkyMock, chatBotMessageService, chatBotMessageTextHandler;

  beforeEach(function() {
    oembedImageFilterMock = sinon.spy(function(text) {
      return text;
    });

    linkyMock = sinon.spy(function(text) {
      return text;
    });

    esnEmoticonifyMock = sinon.spy(function(text) {
      return text;
    });

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('oembedImageFilterFilter', oembedImageFilterMock);
      $provide.value('linkyFilter', linkyMock);
      $provide.value('esnEmoticonifyFilter', esnEmoticonifyMock);
    });

    angular.mock.inject(function(_chatBotMessageService_, _chatBotMessageTextHandler_) {
      chatBotMessageService = _chatBotMessageService_;
      chatBotMessageTextHandler = _chatBotMessageTextHandler_;
    });
  });

  describe('the register function', function() {

    it('should call chatBotMessageTextHandler when type is text', function() {
      var message = {
        subtype: 'text',
        text: 'message'
      };

      chatBotMessageService.register(chatBotMessageTextHandler.type, chatBotMessageTextHandler.setText);
      chatBotMessageService.resolve(message.subtype, message);
      expect(oembedImageFilterMock).to.have.been.calledWith(message.text);
      expect(linkyMock).to.have.been.calledWith(message.text);
      expect(esnEmoticonifyMock).to.have.been.calledWith(message.text);
    });
  });
});
