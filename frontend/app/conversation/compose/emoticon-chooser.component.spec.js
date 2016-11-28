'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('the chatEmoticonChooser component', function() {
  var scope, $componentController, esnEmoticonRegistryMock, $rootScope, KEY_CODE, ChatTextEntitySelectorMock, textEntitySelectorMockInstance, controller, entityListResolverFromListResult;

  beforeEach(function() {
    ChatTextEntitySelectorMock = sinon.spy(function() {
      var self = this; //because of the linters
      this.visible = false;

      textEntitySelectorMockInstance = self;
      this.keyDown = sinon.spy();
      this.textChanged = sinon.spy();
      this.show = sinon.spy(function() {
        self.visible = true;
      });
      this.hide = sinon.spy(function() {
        self.visible = false;
      });
    });

    ChatTextEntitySelectorMock.entityListResolverFromList = sinon.spy(function() {
      entityListResolverFromListResult = {};
      return entityListResolverFromListResult;
    });

    var shortNames = 'smile_a,smile_b,smile_c,smile_ko,smile_ok'.split(',');
    esnEmoticonRegistryMock = {
      getShortNames: sinon.stub().returns(shortNames)
    };
  });

  beforeEach(module('linagora.esn.chat', function($provide) {
    $provide.value('searchProviders', {
      add: sinon.spy()
    });
    $provide.value('chatSearchMessagesProviderService', {});
    $provide.value('ChatTextEntitySelector', ChatTextEntitySelectorMock);
    $provide.value('esnEmoticonRegistry', esnEmoticonRegistryMock);
  }));

  beforeEach(inject(function(_$rootScope_, _$componentController_, _KEY_CODE_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $componentController = _$componentController_;
    KEY_CODE = _KEY_CODE_;
  }));

  beforeEach(function() {
    controller = getController();
  });

  function getController() {
    var component = $componentController('chatEmoticonChooser',
      {
        $scope: scope,
        esnEmoticonRegistryMock: esnEmoticonRegistryMock
      },
      {}
    );
    return component;
  }

  it('should instantiate a ChatTextEntitySelector and put it in the scope', function() {
    expect(controller.entitySelector).to.equals(textEntitySelectorMockInstance);
    expect(ChatTextEntitySelectorMock.entityListResolverFromList).to.have.been.calledWith(esnEmoticonRegistryMock.getShortNames());
    expect(ChatTextEntitySelectorMock).to.have.been.calledWith(sinon.match.same(entityListResolverFromListResult), ':', ':');
  });

  it('should listen to the chat:message:compose:textChanged and pass the textAreaAdaptor to the entitySelector\'s textChanged method', function() {
    var textAreaAdaptor = {};
    $rootScope.$broadcast('chat:message:compose:textChanged', textAreaAdaptor);
    $rootScope.$digest();
    expect(textEntitySelectorMockInstance.textChanged).to.have.been.calledWith(sinon.match.same(textAreaAdaptor));
  });

  it('should listen to the chat:message:compose:keydown and pass the event to the entitySelector\'s keyDown method', function() {
    var event = {};
    $rootScope.$broadcast('chat:message:compose:keydown', event);
    $rootScope.$digest();
    expect(textEntitySelectorMockInstance.keyDown).to.have.been.calledWith(sinon.match.same(event));
  });

  it('should listen to the chat:message:compose:textChanged, chat:message:compose:keydown and chat:message:emoticon events', function() {
    scope.$on = sinon.spy();
    getController();
    expect(scope.$on.firstCall).to.have.been.calledWith('chat:message:compose:keydown');
    expect(scope.$on.secondCall).to.have.been.calledWith('chat:message:compose:textChanged');
    expect(scope.$on.thirdCall).to.have.been.calledWith('chat:message:emoticon');
  });

  it('should listen to the chat:message:emoticon and pass the textAreaAdaptor to the entitySelector\'s show method', function() {
    var textAreaAdaptor = {};
    $rootScope.$broadcast('chat:message:emoticon', textAreaAdaptor);
    $rootScope.$digest();
    expect(textEntitySelectorMockInstance.show).to.have.been.calledWith(sinon.match.same(textAreaAdaptor));
    expect(scope.ctlr.listAllEmoticon).to.be.true;
  });

  it('should listen to the chat:message:emoticon and call entitySelector\'s hide method if the receive the event twice', function() {
    var textAreaAdaptor = {};
    $rootScope.$broadcast('chat:message:emoticon', textAreaAdaptor);
    $rootScope.$broadcast('chat:message:emoticon', textAreaAdaptor);
    $rootScope.$digest();
    expect(textEntitySelectorMockInstance.hide).to.have.been.called;
    expect(scope.ctlr.listAllEmoticon).to.be.false;
  });

  describe('searchTextChange function', function() {
    it('should call textChanged with the right arguments', function() {
      scope.ctlr.textInput = 'sm';
      scope.ctlr.searchTextChange();

      var adapter = {
        textArea: undefined,
        value: ':' + scope.ctlr.textInput,
        selectionStart: scope.ctlr.textInput.length + 1,
        selectionEnd: scope.ctlr.textInput.length + 1
      };
      expect(textEntitySelectorMockInstance.textChanged).to.have.been.calledWith(adapter, 0, false);
    });
  });
});
