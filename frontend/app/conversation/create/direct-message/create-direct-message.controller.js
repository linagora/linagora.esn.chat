(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationCreateDirectMessageController', ChatConversationCreateDirectMessageController);

  function ChatConversationCreateDirectMessageController($log, $state, chatConversationActionsService, notificationFactory, session) {
    var self = this;

    self.create = create;
    self.members = [];

    function create() {
      if (self.form && self.form.$invalid) {
        return;
      }

      var conversation = {
        domain: session.domain._id,
        members: (self.members || []).map(function(member) {
          return member._id;
        })
      };

      chatConversationActionsService.createDirectmessageConversation(conversation).then(function(response) {
        notificationFactory.weakSuccess('success', 'Private conversation successfuly created');
        $state.go('chat.channels-views', { id: response._id});
      }, function(err) {
        $log.error('Error while creating private conversation', err);
        notificationFactory.weakError('error', 'Error while creating private conversation');
      });
    }
  }
})();
