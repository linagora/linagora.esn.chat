(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatTextManipulator', ChatTextManipulator);

  function ChatTextManipulator() {

    return {
      replaceSelectedText: replaceSelectedText
    };

    function replaceSelectedText(value, textareaValue, selectionStart, selectionEnd) {

      if (selectionEnd > selectionStart) {
        return textareaValue.substr(0, selectionStart) + ':' + value + ':' + textareaValue.substr(selectionEnd);
      }

      return textareaValue + ':' + value + ':';
    }
  }
})();
