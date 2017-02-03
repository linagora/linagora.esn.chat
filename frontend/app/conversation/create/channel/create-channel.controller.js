(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationCreateChannelController', ChatConversationCreateChannelController);

  function ChatConversationCreateChannelController($log, $state, chatConversationActionsService, CHAT_CONVERSATION_TYPE, notificationFactory, session) {
    var self = this;

    self.conversation = {
      type: CHAT_CONVERSATION_TYPE.OPEN,
      domain: session.domain._id
    };
    self.create = create;

    function create() {
      if (self.form && self.form.$invalid) {
        return;
      }

      chatConversationActionsService.addChannel(self.conversation).then(function(response) {
        notificationFactory.weakSuccess('success', 'Channel successfuly created');
        $state.go('chat.channels-views', {id: response._id});
      }, function(err) {
        $log.error('Error while creating article', err);
        notificationFactory.weakError('error', 'Error while creating channel');
      });
    }
  }
})();
