'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('the chatEmoticonChooser component', function() {
  var scope, $componentController, esnEmoticonRegistry, $rootScope, KEY_CODE, ChatTextEntitySelectorMock, textEntitySelectorMockInstance, controller, entityListResolverFromListResult;

  beforeEach(function() {
    ChatTextEntitySelectorMock = sinon.spy(function() {
      var self = this; //because of the linters

      textEntitySelectorMockInstance = self;
      this.keyDown = sinon.spy();
      this.textChanged = sinon.spy();
    });

    ChatTextEntitySelectorMock.entityListResolverFromList = sinon.spy(function() {
      entityListResolverFromListResult = {};
      return entityListResolverFromListResult;
    });
  });

  beforeEach(module('linagora.esn.chat', function($provide) {
    $provide.value('ChatTextEntitySelector', ChatTextEntitySelectorMock);
  }));

  beforeEach(inject(function(_$rootScope_, _$componentController_, _KEY_CODE_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $componentController = _$componentController_;
    KEY_CODE = _KEY_CODE_;
    esnEmoticonRegistry = {
      getShortNames: function() {
        return 'smile_a,smile_b,smile_c,smile_ko,smile_ok'.split(',');
      }
    };
  }));

  beforeEach(function() {
    controller = getController();
  });

  function getController() {
    var component = $componentController('chatEmoticonChooser',
      {
        $scope: scope,
        esnEmoticonRegistry: esnEmoticonRegistry
      },
      {}
    );
    return component;
  }

  it('should instantiate a ChatTextEntitySelector and put it in the scope', function() {
    expect(controller.entitySelector).to.equals(textEntitySelectorMockInstance);
    expect(ChatTextEntitySelectorMock.entityListResolverFromList).to.have.been.calledWith(esnEmoticonRegistry.getShortNames());
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

  it('should listen to the chat:message:compose:textChanged and chat:message:compose:keydown events', function() {
    scope.$on = sinon.spy();
    getController();
    expect(scope.$on.firstCall).to.have.been.calledWith('chat:message:compose:keydown');
    expect(scope.$on.secondCall).to.have.been.calledWith('chat:message:compose:textChanged');
  });

});
