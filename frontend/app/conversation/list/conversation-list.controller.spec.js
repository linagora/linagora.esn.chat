'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ChatConversationListController controller', function() {

  var $q, $rootScope, scope, $controller, esnPaginationtionProviderBuilder, chatConversationService, CHAT, chatSearchConversationService, result;

  beforeEach(function() {
    esnPaginationtionProviderBuilder = sinon.spy();
    chatConversationService = {
      list: function() {}
    };

    result = {
      data: []
    };

    chatSearchConversationService = {
      searchConversations: sinon.spy(function() {
        return $q.when(result);
      })
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
      $provide.value('chatSearchConversationService', chatSearchConversationService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _CHAT_, _$q_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $controller = _$controller_;
    CHAT = _CHAT_;
    $q = _$q_;
  }));

  function initController(options) {
    var controller = $controller('ChatConversationListController as ctrl', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {

    it('should call esnPaginationtionProviderBuilder with default options', function() {
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
        limit: CHAT.DEFAULT_FETCH_SIZE
      });
    });

    it('should call esnPaginationtionProviderBuilder with defined elementsPerPage', function() {
      var limit = 2;
      var controller = initController({elementsPerPage: limit});

      controller.$onInit();
      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
        limit: limit
      });
    });
  });

  describe('the onChange function', function() {
    var controller;

    beforeEach(function() {
      controller = initController();
      controller.loadMoreElements = sinon.spy();
    });

    it('should call esnPaginationtionProviderBuilder with chatConversationService.list when conversationSearchInput is undefined', function() {
      controller.onChange();
      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
        limit: CHAT.DEFAULT_FETCH_SIZE
      });
      expect(controller.loadMoreElements).to.have.been.calledOnce;
    });

    it('should call esnPaginationtionProviderBuilder with chatConversationService.list when conversationSearchInput is empty', function() {
      controller.conversationSearchInput = '';
      controller.onChange();
      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', chatConversationService.list, {
        limit: CHAT.DEFAULT_FETCH_SIZE
      });
      expect(controller.loadMoreElements).to.have.been.calledOnce;
    });

    it('should call esnPaginationtionProviderBuilder with right parameters when conversationSearchInput is defined and not empty', function() {
      controller.conversationSearchInput = 'test';
      controller.onChange();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', sinon.match.func, {
        limit: CHAT.DEFAULT_FETCH_SIZE
      });
      expect(controller.loadMoreElements).to.have.been.calledOnce;
    });

    it('should call search function by esnPaginationtionProviderBuilder when conversationSearchInput is defined and not empty', function() {
      controller.conversationSearchInput = 'test';
      controller.onChange();
       var search = sinon.match(function() {
         return chatSearchConversationService.searchConversations(self.conversationSearchInput, {limit: CHAT.DEFAULT_FETCH_SIZE});
       }, 'search');

      expect(esnPaginationtionProviderBuilder).to.have.been.calledWith(controller, 'ChatConversationList', search, {
        limit: CHAT.DEFAULT_FETCH_SIZE
      });
      expect(controller.loadMoreElements).to.have.been.calledOnce;
    });
  });
});
