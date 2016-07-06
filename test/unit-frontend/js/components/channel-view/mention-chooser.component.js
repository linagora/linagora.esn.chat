'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('the chatMentionChooser component', function() {
  var scope, $componentController, $rootScope, KEY_CODE, controller, MENTION_CHOOSER_MAX_RESULT, domainAPIMock, sessionMock, members, $q, ChatTextEntitySelectorMock, textEntitySelectorMockInstance;

  beforeEach(function() {

    ChatTextEntitySelectorMock = sinon.spy(function() {
      var self = this; //because of the linters

      textEntitySelectorMockInstance = self;
      this.keyDown = sinon.spy();
      this.textChanged = sinon.spy();
    });

    members = {data: [{firstname: 'John', lastname:'Doe', _id: '42'}, {_id: '_userId'}]};

    domainAPIMock = {
      getMembers: sinon.spy(function(a, b) {
        return $q.when(members);
      })
    };

    sessionMock = {
      _id: 'id',
      user: {
        _id: '_userId'
      },
      domain: {_id: 'domainId'}
    };

  });

  beforeEach(module('linagora.esn.chat', function($provide) {
    $provide.value('domainAPI', domainAPIMock);
    $provide.value('ChatTextEntitySelector', ChatTextEntitySelectorMock);
    $provide.factory('session', function(_$q_) {
      $q = _$q_;
      sessionMock.ready = $q.when(sessionMock);
      return sessionMock;
    });
  }));

  beforeEach(inject(function(_$rootScope_, _$componentController_, _KEY_CODE_, _MENTION_CHOOSER_MAX_RESULT_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $componentController = _$componentController_;
    KEY_CODE = _KEY_CODE_;
    MENTION_CHOOSER_MAX_RESULT = _MENTION_CHOOSER_MAX_RESULT_;
  }));

  beforeEach(function() {
    controller = getController();
  });

  function getController() {
    var component = $componentController('chatMentionChooser',
      {
        $scope: scope
      },
      {}
    );
    return component;
  }

  describe('The members resolver given to textEntitySelector', function() {
    it('should use domainAPI', function() {
      expect(ChatTextEntitySelectorMock).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(resolver) {
        var string = 'string_string';

        resolver(string);
        $rootScope.$digest();
        expect(domainAPIMock.getMembers).to.have.been.calledWith(sessionMock.domain._id, {
          limit: MENTION_CHOOSER_MAX_RESULT,
          offset: 0,
          search: string.replace('_', ' ')
        });

        return true;
      })));
    });

    it('should return a list of user without current user', function() {
      expect(ChatTextEntitySelectorMock).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(resolver) {
        var thenSpy = sinon.spy();

        resolver('').then(thenSpy);
        $rootScope.$digest();
        expect(thenSpy).to.have.been.calledWith([members.data[0]]);

        return true;
      })));
    });
  });

  describe('The toHumanValue method given to ChatTextEntitySelector', function() {
    it('shoud concat firstname and lastname with _', function() {
      expect(ChatTextEntitySelectorMock).to.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match.func.and(sinon.match(function(toHumanValue) {
        return toHumanValue({firstname: 'firstname', lastname: 'lastname'}) === 'firstname_lastname';
      })));
    });
  });

  describe('The toRealValue method given to ChatTextEntitySelector', function() {
    it('shoud concat firstname and lastname with _', function() {
      expect(ChatTextEntitySelectorMock).to.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match.any, sinon.match.func.and(sinon.match(function(toRealValue) {
        return toRealValue({_id:'entity'}) === 'entity';
      })));
    });
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
