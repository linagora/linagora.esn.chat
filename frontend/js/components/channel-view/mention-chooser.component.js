(function() {
  'use strict';

  angular.module('linagora.esn.chat').component('chatMentionChooser', {
    templateUrl: '/chat/views/components/conversation-view/messages/mention-chooser.html',
    controllerAs: 'ctlr',
    controller: ChatMentionsChooser
  });

  function ChatMentionsChooser($scope, ChatTextEntitySelector, session, domainAPI, _, MENTION_CHOOSER_MAX_RESULT) {

    var self = this;
    var membersResolver = function(string) {
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
    };

    self.entitySelector = new ChatTextEntitySelector(membersResolver, '@', null, function(user) {
      return user.firstname + '_' + user.lastname;
    }, _.property('_id'));

    $scope.$on('chat:message:compose:keydown', function(angularEvent, event) {
      self.entitySelector.keyDown(event);
      $scope.$applyAsync();
    });

    $scope.$on('chat:message:compose:textChanged', function(angularEvent, textareaAdapter) {
      self.entitySelector.textChanged(textareaAdapter);
    });
  }

})();
