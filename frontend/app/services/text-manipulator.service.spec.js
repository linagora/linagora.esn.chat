'use strict';

/* global chai: false */
var expect = chai.expect;

describe('the ChatTextManipulator constructor', function() {
  var textarea, ChatTextManipulator, textResult;

  beforeEach(module('linagora.esn.chat', function($provide) {

    textarea = {
      value: '',
      selectionStart: 0,
      selectionEnd: 0
    };
    $provide.value('searchProviders', {
      add: function() {}
    });
    $provide.value('chatSearchProviderService', {});
  }));

  beforeEach(inject(function(_$rootScope_, _ChatTextManipulator_) {
    ChatTextManipulator = _ChatTextManipulator_;
  }));

  describe('the replaceSelectedText method', function() {

    it('should update the text with the input value', function() {

      textResult = ChatTextManipulator.replaceSelectedText('aValue', textarea.value, textarea.selectionStart, textarea.selectionEnd);

      expect(textResult).to.equal(':aValue:');
    });

    it('should replace the selected text with the input value', function() {
      textarea.value = '00Selected00';

      textResult = ChatTextManipulator.replaceSelectedText('bien', textarea.value, 2, 10);

      expect(textResult).to.equal('00:bien:00');
    });
  });
});
