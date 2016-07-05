(function() {
  'use strict';

  angular.module('linagora.esn.chat').component('chatMentionChooser', {
    templateUrl: '/chat/views/components/channel-view/messages/mention-chooser.html',
    controllerAs: 'ctlr',
    controller: ChatMentionsChooser
  });

  function ChatMentionsChooser($scope, ChatTextEntitySelector, session, domainAPI, _, MENTION_CHOOSER_MAX_RESULT) {

    var self = this;
    var membersResolver = function(string) {
      return session.ready.then(function(session) {
        return domainAPI.getMembers(session.domain._id, {
          search: string,
          limit: MENTION_CHOOSER_MAX_RESULT,
          offset: 0
        }).then(_.property('data'));
      });
    };

    self.entitySelector = new ChatTextEntitySelector(membersResolver, '@', null, _.property('_id'));

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      self.entitySelector.keyDown(event);
      $scope.$applyAsync();
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      self.entitySelector.textChanged(textareaAdapter);
    });
  }

})();
