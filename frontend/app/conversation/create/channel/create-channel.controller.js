(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationCreateChannelController', ChatConversationCreateChannelController);

  function ChatConversationCreateChannelController($log, $state, chatConversationsService, chatLocalStateService, CHAT_CONVERSATION_TYPE, notificationFactory) {
    var self = this;

    self.conversation = {
      type: CHAT_CONVERSATION_TYPE.CHANNEL
    };
    self.create = create;

    function create() {
      if (self.form && self.form.$invalid) {
        return;
      }

      chatConversationsService.addChannels(self.conversation).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        notificationFactory.weakSuccess('success', 'Channel successfuly created');
        $state.go('chat.channels-views', {id: response.data._id});
      }, function(err) {
        $log.error('Error while creating article', err);
        notificationFactory.weakError('error', 'Error while creating channel');
      });
    }
  }
})();
