(function() {
  'use strict';

  angular.module('linagora.esn.chat').component('chatEmoticonChooser', {
    templateUrl: '/chat/views/components/conversation-view/messages/chat-emoticon-chooser.html',
    controllerAs: 'ctlr',
    controller: ChatEmoticonChooserController
  });

  function ChatEmoticonChooserController($scope, esnEmoticonRegistry, KEY_CODE, ChatTextEntitySelector) {
    var self = this;
    var emoticonListResolver = ChatTextEntitySelector.entityListResolverFromList(esnEmoticonRegistry.getShortNames());
    self.entitySelector = new ChatTextEntitySelector(emoticonListResolver, ':', ':');

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      self.entitySelector.keyDown(event);
      $scope.$applyAsync();
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      self.entitySelector.textChanged(textareaAdapter);
    });
  }

})();
