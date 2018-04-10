'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatConversationResolverService service', function() {
  var $rootScope, $state, $q, defaultConversation, lastConversationId, lastConversation, chatConversationService, chatConversationActionsService, chatConversationsStoreService, chatLastConversationService, chatConversationResolverService, conversationId;
  var successSpy, errorSpy;

  beforeEach(
    angular.mock.module('linagora.esn.chat')
  );

  beforeEach(function() {
    chatConversationService = {};
    chatConversationActionsService = {};
    conversationId = 'defaultChannelId';
    defaultConversation = {_id: conversationId};
    chatConversationsStoreService = {
      channels: [defaultConversation],
      findConversation: sinon.spy()
    };
    lastConversationId = 'lastConversationId';
    lastConversation = {_id: lastConversationId};
    chatLastConversationService = {};
    successSpy = sinon.spy();
    errorSpy = sinon.spy();
    $state = {
      go: sinon.spy()
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {add: angular.noop});
      $provide.value('chatSearchProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('$state', $state);
      $provide.value('chatConversationActionsService', chatConversationActionsService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('chatLastConversationService', chatLastConversationService);
      $provide.value('chatConversationService', chatConversationService);
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$q_, _chatConversationResolverService_) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      chatConversationResolverService = _chatConversationResolverService_;

      chatConversationActionsService.ready = $q.when();
    });
  });

  describe('When input conversation is defined', function() {
    it('should resolve with the input conversation when it exists', function() {
      var validConversation = 'validConversation';
      var result = {_id: 1};

      chatConversationService.get = sinon.spy(function() {
        return $q.when(result);
      });
      chatLastConversationService.get = sinon.spy();

      chatConversationResolverService(validConversation).then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.get).to.have.been.calledWith(validConversation);
      expect(chatLastConversationService.get).to.not.have.been.called;
      expect(successSpy).to.have.been.calledWith(result);
      expect(errorSpy).to.not.have.been.called;
    });

    describe('when input conversation does not exists', function() {
      it('should resolve with default channel if last conversation fails', function() {
        var validConversation = 'validConversation';

        chatConversationService.get = sinon.spy(function() {
          return $q.reject(new Error('Does not exists'));
        });
        chatLastConversationService.get = sinon.spy(function() {
          return $q.reject(new Error('I failed to retrieve conversation'));
        });

        chatConversationResolverService(validConversation).then(successSpy, errorSpy);
        $rootScope.$digest();

        expect(chatConversationService.get).to.have.been.calledWith(validConversation);
        expect(chatLastConversationService.get).to.have.been.calledOnce;
        expect(successSpy).to.have.been.calledWith(defaultConversation);
        expect(errorSpy).to.not.have.been.called;
      });

      it('should resolve with last conversation if valid', function() {
        var validConversation = 'validConversation';

        chatConversationService.get = sinon.stub();
        chatConversationService.get.onCall(0).returns($q.reject('I can not find the conversation'));
        chatConversationService.get.onCall(1).returns($q.when(lastConversation));
        chatLastConversationService.get = sinon.spy(function() {
          return $q.when(lastConversationId);
        });

        chatConversationResolverService(validConversation).then(successSpy, errorSpy);
        $rootScope.$digest();

        expect(chatConversationService.get).to.have.been.calledTwice;
        expect(chatLastConversationService.get).to.have.been.calledOnce;
        expect(successSpy).to.have.been.calledWith(lastConversation);
        expect(errorSpy).to.not.have.been.called;
      });

      it('should resolve with default if last is not valid', function() {
        var validConversation = 'validConversation';

        chatConversationService.get = sinon.stub();
        chatConversationService.get.onCall(0).returns($q.reject(new Error('I can not find the conversation')));
        chatConversationService.get.onCall(1).returns($q.reject(new Error('I can not find the last conversation')));
        chatLastConversationService.get = sinon.spy(function() {
          return $q.when(lastConversationId);
        });

        chatConversationResolverService(validConversation).then(successSpy, errorSpy);
        $rootScope.$digest();

        expect(chatConversationService.get).to.have.been.calledTwice;
        expect(chatLastConversationService.get).to.have.been.calledOnce;
        expect(successSpy).to.have.been.calledWith(defaultConversation);
        expect(errorSpy).to.not.have.been.called;
      });
    });
  });

  describe('When input conversation is not defined', function() {
    it('should resolve with default channel if last conversation fails', function() {
      chatConversationService.get = sinon.spy();
      chatLastConversationService.get = sinon.spy(function() {
        return $q.reject(new Error('I failed to retrieve conversation'));
      });

      chatConversationResolverService().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.get).to.not.have.been.called;
      expect(chatLastConversationService.get).to.have.been.calledOnce;
      expect(successSpy).to.have.been.calledWith(defaultConversation);
      expect(errorSpy).to.not.have.been.called;
    });

    it('should resolve with last conversation if valid', function() {
      chatConversationService.get = sinon.spy(function() {
        return $q.when(lastConversation);
      });

      chatLastConversationService.get = sinon.spy(function() {
        return $q.when(lastConversationId);
      });

      chatConversationResolverService().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.get).to.have.been.calledOnce;
      expect(chatConversationService.get).to.have.been.calledWith(lastConversationId);
      expect(chatLastConversationService.get).to.have.been.calledOnce;
      expect(chatLastConversationService.get).to.have.been.calledBefore(chatConversationService.get);
      expect(successSpy).to.have.been.calledWith(lastConversation);
      expect(errorSpy).to.not.have.been.called;
    });

    it('should resolve with default if last is not valid', function() {

      chatConversationService.get = sinon.spy(function() {
        return $q.reject(new Error('I can not find conversation'));
      });
      chatLastConversationService.get = sinon.spy(function() {
        return $q.when(lastConversationId);
      });

      chatConversationResolverService().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.get).to.have.been.calledOnce;
      expect(chatConversationService.get).to.have.been.calledWith(lastConversationId);
      expect(chatLastConversationService.get).to.have.been.calledOnce;
      expect(chatLastConversationService.get).to.have.been.calledBefore(chatConversationService.get);
      expect(successSpy).to.have.been.calledWith(defaultConversation);
      expect(errorSpy).to.not.have.been.called;
    });

    it('should reject when default is undefined and if last is not valid', function() {
      chatConversationsStoreService.channels = [];
      chatConversationService.get = sinon.spy(function() {
        return $q.reject(new Error('I can not find conversation'));
      });
      chatLastConversationService.get = sinon.spy(function() {
        return $q.when(lastConversationId);
      });

      chatConversationResolverService().then(successSpy, errorSpy);
      $rootScope.$digest();

      expect(chatConversationService.get).to.have.been.calledOnce;
      expect(chatConversationService.get).to.have.been.calledWith(lastConversationId);
      expect(chatLastConversationService.get).to.have.been.calledOnce;
      expect(chatLastConversationService.get).to.have.been.calledBefore(chatConversationService.get);
      expect(successSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.called;
      expect(errorSpy.firstCall.args[0].message).to.match(/Can not find any valid conversation to display/);
    });
  });
});
