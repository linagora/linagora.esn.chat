(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatJoinConversationController', ChatJoinConversationController);

  function ChatJoinConversationController($log, $q, chatConversationActionsService, session) {
    var self = this;

    self.join = join;

    function join() {
      return chatConversationActionsService.joinConversation(self.conversation).then(function() {
        if (self.onJoin) {
          return self.onJoin(session.user._id);
        }

        return $q.when();
      }).catch(function(err) {
        $log.error('Error while joining the conversation', err);

        return $q.reject(err);
      });
    }
  }
})();
