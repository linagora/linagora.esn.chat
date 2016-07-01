'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('the chatEmoticonChooser component', function() {
  var scope, $componentController, esnEmoticonList, $rootScope, KEY_CODE;

  beforeEach(module('linagora.esn.chat'));

  beforeEach(inject(function(_$rootScope_, _$componentController_, _KEY_CODE_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $componentController = _$componentController_;
    KEY_CODE = _KEY_CODE_;
    esnEmoticonList = 'smile_a,smile_b,smile_c,smile_ko,smile_ok';
  }));

  function getController() {
    var component = $componentController('chatEmoticonChooser',
      {
        $scope: scope,
        esnEmoticonList: esnEmoticonList
      },
      {}
    );
    return component;
  }

  function getTextAreaAdapter(selectionStart, selectionEnd, text) {
    return {
      value: text,
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      replaceText: sinon.spy()
    };
  }

  it('should listen to the chat:message:compose:textChanged and chat:message:compose:keydown events', function() {
    scope.$on = sinon.spy();
    getController();
    expect(scope.$on.firstCall).to.have.been.calledWith('chat:message:compose:keydown');
    expect(scope.$on.secondCall).to.have.been.calledWith('chat:message:compose:textChanged');
  });

  describe('textChanged events', function() {
    it('should switch state to visible when the text is :something', function() {
      var controller = getController();
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(6, 6, ':smile')
      );
      expect(controller.visible).to.be.true;
      expect(controller.emojiStart).to.equal('smile');
    });

    it('should switch state to not visible when the emoji becomes unkonwn', function() {
      var controller = getController();
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(6, 6, ':smile')
      );
      expect(controller.visible).to.be.true;
      expect(controller.emojiStart).to.equal('smile');
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(7, 7, ':smilee')
      );
      expect(controller.visible).to.be.false;
    });

    it('should not switch state to visible when the emoji text is not in the list', function() {
      var controller = getController();
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(6, 6, ':micro')
      );
      expect(controller.visible).to.be.false;
    });

    it('should not switch state to visible when text is selected', function() {
      var controller = getController();
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(3, 6, ':smile')
      );
      expect(controller.visible).to.be.false;
    });

    it('should switch state to not visible when text is selected', function() {
      var controller = getController();
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(6, 6, ':smile')
      );
      expect(controller.visible).to.be.true;
      $rootScope.$broadcast(
        'chat:message:compose:textChanged',
        getTextAreaAdapter(3, 6, ':smile')
      );
      expect(controller.visible).to.be.false;
    });
  });

  describe('keydown event', function() {

    function getEvt(keyCode) {
      return {
        keyCode: keyCode,
        preventDefault: sinon.spy()
      };
    }

    describe('Enter event', function() {
      it('should call self.select with the selected emoji', function() {
        var controller = getController();
        $rootScope.$broadcast(
          'chat:message:compose:textChanged',
          getTextAreaAdapter(6, 6, ':smile')
        );
        controller.focusIndex = 1;
        controller.select = sinon.spy();

        $rootScope.$broadcast('chat:message:compose:keydown', getEvt(KEY_CODE.ENTER));
        expect(controller.select).to.have.been.calledWith('smile_b');
      });
    });

    describe('ArrowUp/ArrowLeft event', function() {
      it('should update the selected emoji index', function() {
        var controller = getController();
        $rootScope.$broadcast(
          'chat:message:compose:textChanged',
          getTextAreaAdapter(6, 6, ':smile')
        );

        [
          { event: getEvt(KEY_CODE.ARROW_UP), expected: 4 },
          { event: getEvt(KEY_CODE.ARROW_UP), expected: 3 },
          { event: getEvt(KEY_CODE.ARROW_LEFT), expected: 2 },
          { event: getEvt(KEY_CODE.ARROW_LEFT), expected: 1 },
        ].forEach(function(testSpec) {
          $rootScope.$broadcast('chat:message:compose:keydown', testSpec.event);
          $rootScope.$digest();
          expect(controller.focusIndex).to.equal(testSpec.expected);
        });
      });
    });
    describe('ArrowDown/ArrowRight/Tab event', function() {
      it('should update the selected emoji index', function() {
        var controller = getController();
        $rootScope.$broadcast(
          'chat:message:compose:textChanged',
          getTextAreaAdapter(6, 6, ':smile')
        );

        [
          { event: getEvt(KEY_CODE.ARROW_DOWN), expected: 1 },
          { event: getEvt(KEY_CODE.ARROW_DOWN), expected: 2 },
          { event: getEvt(KEY_CODE.ARROW_RIGHT), expected: 3 },
          { event: getEvt(KEY_CODE.TAB), expected: 4 },
          { event: getEvt(KEY_CODE.ARROW_RIGHT), expected: 0 }
        ].forEach(function(testSpec) {
          $rootScope.$broadcast('chat:message:compose:keydown', testSpec.event);
          $rootScope.$digest();
          expect(controller.focusIndex).to.equal(testSpec.expected);
        });
      });

      it('should not update the selected emoji index if there is a meta key with Tab', function() {
        var controller = getController();
        $rootScope.$broadcast(
          'chat:message:compose:textChanged',
          getTextAreaAdapter(6, 6, ':smile')
        );

        [
          {evt: getEvt('Tab'), k: 'altKey'},
          {evt: getEvt('Tab'), k: 'ctrlKey'},
          {evt: getEvt('Tab'), k: 'metaKey'},
          {evt: getEvt('Tab'), k: 'shiftKey'}
        ].forEach(function(testSpec) {
          testSpec.evt[testSpec.k] = true;
          $rootScope.$broadcast('chat:message:compose:keydown', testSpec.evt);
          $rootScope.$digest();
          expect(controller.focusIndex).to.equal(0);
        });
      });

    });

    describe('event.which', function() {

      function getEvt(keyCode) {
        return {
          which: keyCode,
          preventDefault: sinon.spy()
        };
      }

      it('should use event.which if event.keyCode is undefined', function() {
        var controller = getController();
        $rootScope.$broadcast(
          'chat:message:compose:textChanged',
          getTextAreaAdapter(6, 6, ':smile')
        );
        controller.focusIndex = 1;
        controller.select = sinon.spy();

        $rootScope.$broadcast('chat:message:compose:keydown', getEvt(KEY_CODE.ENTER));
        expect(controller.select).to.have.been.calledWith('smile_b');
      });
    });
  });

  describe('select() method', function() {
    it('should update the textarea text', function() {
      var controller = getController();
      var adapter = getTextAreaAdapter(6, 6, ':smile');
      $rootScope.$broadcast('chat:message:compose:textChanged', adapter);
      controller.select('smile_c');
      expect(adapter.replaceText).to.have.been.calledWith(':smile_c:', 9, 9);
    });
    it('should update the textarea text in the middle of text', function() {
      var controller = getController();
      var adapter = getTextAreaAdapter(20, 20, ':smile_a: test :smil test');
      $rootScope.$broadcast('chat:message:compose:textChanged', adapter);
      controller.select('smile_c');
      expect(adapter.replaceText).to.have.been.calledWith(':smile_a: test :smile_c: test', 24, 24);
    });
    it('shouldn\'t be confused when there is two times the same emoji start', function() {
      var controller = getController();
      var adapter = getTextAreaAdapter(18, 18, ':smile test :smile test');
      $rootScope.$broadcast('chat:message:compose:textChanged', adapter);
      controller.select('smile_c');
      expect(adapter.replaceText).to.have.been.calledWith(':smile test :smile_c: test', 21, 21);
    });

  });
});
