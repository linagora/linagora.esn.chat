(function() {
  'use strict';

  angular.module('linagora.esn.chat').component('chatEmoticonChooser', {
    templateUrl: '/chat/views/components/channel-view/messages/chat-emoticon-chooser.html',
    controllerAs: 'ctlr',
    controller: ChatEmoticonChooserController
  });

  function ChatEmoticonChooserController($scope, esnEmoticonList, KEY_CODE) {
    var self = this;
    var textarea;
    var emoticonList = esnEmoticonList.split(',');

    self.visible = false;
    self.focusIndex = 0;
    self.emojiStart = '';

    function isTab(event) {
      var keyCode = event.keyCode || event.which || 0;

      return keyCode === KEY_CODE.TAB && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    }

    function _resetState() {
      if (!self.visible) {
        return;
      }
      textarea = null;
      self.visible = false;
      self.focusIndex = 0;
      self.emojiStart = '';
    }

    function _setVisible() {
      if (self.visible) {
        return;
      }
      self.visible = true;
    }

    function _updateFocusIndex(diff) {
      $scope.$applyAsync(function() {
        self.focusIndex = (self.focusIndex + self.emoticonList.length + diff) % self.emoticonList.length;
      });
    }

    self.select = function(emoticon) {
      insertEmojiTag(textarea, emoticon);
      _resetState();
    };

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      if (!self.visible) {
        return;
      }

      var keyCode = event.keyCode || event.which || 0;

      if (keyCode === KEY_CODE.ENTER) {
        event.preventDefault();
        self.select(self.emoticonList[self.focusIndex]);
      } else if (keyCode === KEY_CODE.ARROW_UP || keyCode === KEY_CODE.ARROW_LEFT) {
        event.preventDefault();
        _updateFocusIndex(-1);
      } else if (keyCode === KEY_CODE.ARROW_DOWN || keyCode === KEY_CODE.ARROW_RIGHT || isTab(event)) {
        event.preventDefault();
        _updateFocusIndex(1);
      }
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      textarea = textareaAdapter;
      if (textarea.selectionStart !== textarea.selectionEnd) {
        _resetState();
        return;
      }
      var inEdition = emojiInEdition(textarea.value, textarea.selectionStart);
      if (!inEdition || inEdition.length < 2) {
        _resetState();
        return;
      }

      self.emoticonList = emoticonList.filter(function(e) {
        return e.indexOf(inEdition) === 0;
      });
      if (self.emoticonList.length) {
        self.emojiStart = inEdition;
        _setVisible();
        return;
      }
      _resetState();
    });
  }

  function emojiInEdition(text, cursorNextChar) {
    var textUntilCursorEnd = text.substring(0, cursorNextChar);
    var emojiLast = textUntilCursorEnd.match(/:([a-zA-Z0-9_+-]+)$/);
    if (emojiLast) {
      return emojiLast[1];
    }
  }

  function insertEmojiTag(textarea, emoji) {
    var value = textarea.value,
        selectionStart = textarea.selectionStart,
        valueStart = value.substring(0, selectionStart),
        valueEnd = value.substring(selectionStart);

    var distanceToColon = valueStart.match(/:([^:]+)$/)[1].length;
    var newValueStart = valueStart.substr(0, valueStart.length - distanceToColon) + emoji + ':';
    textarea.replaceText(newValueStart  + valueEnd, newValueStart.length, newValueStart.length);
  }

})();
