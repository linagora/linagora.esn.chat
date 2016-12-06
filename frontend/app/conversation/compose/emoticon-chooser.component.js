(function() {
  'use strict';

  angular.module('linagora.esn.chat').component('chatEmoticonChooser', {
    templateUrl: '/chat/app/conversation/compose/emoticon-chooser.html',
    controllerAs: 'ctlr',
    controller: ChatEmoticonChooserController
  });

  function ChatEmoticonChooserController($scope, esnEmoticonRegistry, KEY_CODE, ChatTextEntitySelector) {
    /*eslint no-unused-vars: ["error", { "args": "none" }]*/
    var self = this;
    var emoticonListResolver = ChatTextEntitySelector.entityListResolverFromList(esnEmoticonRegistry.getShortNames());

    self.entitySelector = new ChatTextEntitySelector(emoticonListResolver, ':', ':');
    self.listAllEmoticon = false;

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      self.entitySelector.keyDown(event);
      $scope.$applyAsync();
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      self.listAllEmoticon = false;
      self.entitySelector.textChanged(textareaAdapter);
    });

    $scope.$on('chat:message:emoticon', function(angularEvent, textareaAdapter) {
      if (!self.entitySelector.visible) {
        self.textInput = '';
        self.text = textareaAdapter;
        self.listAllEmoticon = true;
        self.entitySelector.show(textareaAdapter);
      } else {
        self.entitySelector.hide();
        self.listAllEmoticon = false;
      }
    });

    self.searchTextChange = function() {
      var adapter = {
        textArea: self.text,
        value: ':' + self.textInput.toLowerCase(),
        selectionStart: self.textInput.length + 1,
        selectionEnd: self.textInput.length + 1
      };

      self.entitySelector.textChanged(adapter, 0, false);
    };
  }
})();
