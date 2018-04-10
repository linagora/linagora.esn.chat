'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationSidebarStars controller', function() {

  var $controller, esnPaginationtionProviderBuilder, options, CHAT;

  beforeEach(function() {
    esnPaginationtionProviderBuilder = sinon.spy();

    module('linagora.esn.chat', function($provide) {
      $provide.value('esnPaginationtionProviderBuilder', esnPaginationtionProviderBuilder);
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('newProvider', function(_provider) {
        return _provider;
      });
      $provide.value('chatSearchProviderService', {});
      $provide.value('chatConversationService', {});
    });
  });

  beforeEach(angular.mock.inject(function(_$controller_, _CHAT_) {
    $controller = _$controller_;
    CHAT = _CHAT_;
    options = {
      offset: 0,
      limit: CHAT.DEFAULT_FETCH_SIZE
    };
  }));

  function initController() {
    return $controller('ChatConversationSidebarStarsListController');
  }

  describe('the initialization', function() {

    it('should call esnPaginationtionProviderBuilder with the right params', function() {
      var controller = initController();

      controller.$onInit();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'conversationSidebarStars', sinon.match.func, options);
    });
  });
});
