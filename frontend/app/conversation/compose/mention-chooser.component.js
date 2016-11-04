(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatMentionChooser', {
      templateUrl: '/chat/app/conversation/compose/mention-chooser.html',
      controllerAs: 'ctlr',
      controller: ChatMentionsChooserController
    });

  function ChatMentionsChooserController($scope, ChatTextEntitySelector, chatUsername, session, domainAPI, _, MENTION_CHOOSER_MAX_RESULT, CHAT_MENTION_CHAR) {
    var self = this;

    self.entitySelector = new ChatTextEntitySelector(membersResolver, CHAT_MENTION_CHAR, null, chatUsername.generate, _.property('_id'));

    function membersResolver(string) {
      return session.ready.then(function(session) {
        return domainAPI.getMembers(session.domain._id, {
          search: string.replace(/_/g, ' '),
          limit: MENTION_CHOOSER_MAX_RESULT,
          offset: 0
        }).then(function(response) {
          return response.data.filter(function(user) {
            return user._id !== session.user._id;
          });
        });
      });
    }

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      self.entitySelector.keyDown(event);
      $scope.$applyAsync();
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      self.entitySelector.textChanged(textareaAdapter);
    });
  }

})();
