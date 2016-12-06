(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatJoinConversationController', ChatJoinConversationController);

  function ChatJoinConversationController($log, chatConversationService, chatLocalStateService, session) {
    var self = this;

    self.join = join;

    function join() {
      chatConversationService.join(self.conversation._id, session.user._id).then(function() {
        self.onJoin && self.onJoin(session.user._id);

        return self.conversation;
      }).then(function() {
        return chatLocalStateService.updateConversation(self.conversation._id);
      }).catch(function(err) {
        $log.error('Error while joining the conversation', err);
      });
    }
  }
})();
