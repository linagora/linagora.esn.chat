'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationListController controller', function() {

  var $rootScope, scope, $controller, esnPaginationtionProviderBuilder, chatConversationService, CHAT;

  beforeEach(function() {
    esnPaginationtionProviderBuilder = sinon.spy();
    chatConversationService = {
      list: function() {}
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('esnPaginationtionProviderBuilder', esnPaginationtionProviderBuilder);
      $provide.value('chatConversationService', chatConversationService);
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _CHAT_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT = _CHAT_;
  }));

  function initController(options) {
    var controller = $controller('ChatConversationListController as ctrl', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  it('should call esnPaginationtionProviderBuilder with default options', function() {
    var controller = initController();

    expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
      limit: CHAT.DEFAULT_FETCH_SIZE
    });
  });

  it('should call esnPaginationtionProviderBuilder with defined elementsPerPage', function() {
    var limit = 2;
    var controller = initController({elementsPerPage: limit});

    expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
      limit: limit
    });
  });
});
