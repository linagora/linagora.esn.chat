(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationCreatePrivateController', ChatConversationCreatePrivateController);

  function ChatConversationCreatePrivateController($log, $state, chatConversationsService, chatLocalStateService, notificationFactory, session) {
    var self = this;

    self.create = create;
    self.members = [];

    function create() {
      if (self.form && self.form.$invalid) {
        return;
      }

      var group = {
        domain: session.domain._id,
        members: self.members
      };

      chatConversationsService.addPrivateConversation(group).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        notificationFactory.weakSuccess('success', 'Private conversation successfuly created');
        $state.go('chat.channels-views', { id: response.data._id});
      }, function(err) {
        $log.error('Error while creating private conversation', err);
        notificationFactory.weakError('error', 'Error while creating private conversation');
      });
    }
  }
})();
